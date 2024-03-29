import argparse
import errno
import gc
import os
import torch
import asyncio
# import random
import time
import pandas as pd
import json
from pyarrow.parquet import ParquetDataset
from pandas.core.series import Series
from pathlib import Path
from transformers import BertForSequenceClassification, BertTokenizerFast
from transformers.tokenization_utils import BatchEncoding, PaddingStrategy, TruncationStrategy
from typing import Dict, List, Optional
# from utils.gpu_profile import report_GRAM_memory_available
# from utils.data_profile import return_input_sub_folder

from shutil import move

class LoadedModelObj:
    model: BertForSequenceClassification
    tokenizer: BertTokenizerFast
    cuda_device: torch.device
    cache_dir: Path

    def __init__(self,
                 model_local_path: Path,
                 cuda_device: Optional[torch.device] = None,
                 cache_dir: Optional[Path] = None):
        # The default image uses /home/ray/.cache/huggingface/hub as the cache, but doesn't have write permission there.
        # Hopefully the TRANSFORMERS_CACHE has been set for the image we are actually using, but try '.' if not.
        if cache_dir is not None:
            self.cache_dir = cache_dir
        else:
            self.cache_dir = Path(os.getenv("TRANSFORMERS_CACHE", os.curdir))
        os.environ['TRANSFORMERS_CACHE'] = str(self.cache_dir)

        # The tokenizer is going to be using the data on the CPU
        self.tokenizer = BertTokenizerFast.from_pretrained(model_local_path, cache_dir=cache_dir)

        # The model will need to move itself and the data to the GPU for efficient operation
        self.model = BertForSequenceClassification.from_pretrained(pretrained_model_name_or_path=model_local_path,
                                                                   num_labels=2,
                                                                   cache_dir=cache_dir)
        self.cuda_device = cuda_device
        if self.cuda_device:
            # If we have a GPU then that's where the model should be.
            self.model.to(cuda_device)
            os.environ['PYTORCH_CUDA_ALLOC_CONF'] = "max_split_size_mb:500"

    def apply_tokenizer(self, data: Series) -> BatchEncoding:
        """ CPU-heavy task.
        """
        tokenized = self.tokenizer(data.tolist(),
                                   return_tensors="pt",
                                   truncation=TruncationStrategy.LONGEST_FIRST,
                                   padding=PaddingStrategy.LONGEST)
        if self.cuda_device:
            # If we are using a GPU, the tokens need to be there.
            tokenized = tokenized.to(self.cuda_device)
        return tokenized

    def apply_model(self, tokens: BatchEncoding) -> List[float]:
        """ GPU-heavy task.
        """
        # Apply a binary classifier with logits column 0 for not-a-problem, and column 1 for bad.
        # A BatchEncoding includes 'data', 'encodings', 'is_fast', and 'n_sequences'.
        model_out = self.model(**tokens)

        # Normalize the values for each row into probabilities.
        softmax_result = torch.nn.functional.softmax(model_out.logits, dim=1)
        # A List[float] seems like a sensible way to return this
        confidence_label_1 = softmax_result[:, 1].tolist()

        return confidence_label_1

class ModelMapActor:
    """ Following the Actor example from the Ray documentation
    https://docs.ray.io/en/master/data/api/doc/ray.data.Dataset.map_batches.html
    """
    models: Dict[str, LoadedModelObj]
    tokenizers_all_same: bool

    def __init__(self, model_paths: Dict[str, Path], tokenizers_all_same: bool, actor_name: str, checkpoint_file: str, OOM_revisit_log: str):
        """
        :param model_paths: Map from the column name (to create) to where the model is stored (path)
        """
        # for fault-tolerance to avoid repeating processing the completed parquet list
        self.actor_name = actor_name
        self.parquet_list = []
        self.checkpoint_file = checkpoint_file
        self.number_of_files_remaining = 10000000
        self.initial_checkpoint_written = False
        self.OOM_revisit_log = OOM_revisit_log
        # This might happen if this particular actor was retried independently by Ray scheduler
        # after a worker pod is restarted by Kubernetes
        # When the entire job is restarted, the checkpoint file should not be there for this actor
        # because it has been renamed
#        if os.path.exists(self.checkpoint_file):
            # Restore from checkpoint
#            with open(self.checkpoint_file, "r") as f:
#                self.parquet_list = json.load(f)
            # skip the fist file, which could be the source of main memory OOM
#            file_to_be_revisited = self.parquet_list.pop(0)
            #await self.append_OOM(file_to_be_revisited)
            #await self.check_point()
#            print(f"Problematic file needs special attention: {file_to_be_revisited}")

        if torch.cuda.is_available():
            # Just take the first visible device (there should be exactly one)
            dev_num = int(os.getenv('CUDA_VISIBLE_DEVICES', '0').split(',')[0])
            cuda_device = torch.device(f'cuda:{dev_num}')
            print(f"running in GPU mode cuda_device={cuda_device}")
        else:
            print("running in CPU-only mode")
            cuda_device = None

        self.models = dict()
        self.tokenizers_all_same = tokenizers_all_same
        for curr_colname, curr_model_path in model_paths.items():
            curr_model = LoadedModelObj(model_local_path=curr_model_path, cuda_device=cuda_device)
            self.models[curr_colname] = curr_model
            # print(f"DEBUG - Loaded {curr_colname} model from {curr_model.model.name_or_path}  device={cuda_device}")

    async def append_OOM(self, file_to_be_revisited):
        import random
        await asyncio.sleep(random.randint(2, 10))
        OOM_list = []
        if os.path.exists(self.OOM_revisit_log):
            try:
                with open(self.OOM_revisit_log, "r") as f:
                    OOM_list = json.load(f)
            except json.decoder.JSONDecodeError:
                pass
        OOM_list.append(file_to_be_revisited)
        with open(self.OOM_revisit_log, "w") as fw:
            json.dump(OOM_list, fw)

    async def check_point(self):
        with open(self.checkpoint_file, "w") as fw:
            json.dump(self.parquet_list, fw)

    async def get_number_remaining(self):
        return self.number_of_files_remaining

    async def is_initial_checkpoint_written(self):
        return self.initial_checkpoint_written

    async def replace_parquet_list(self, new_parquet_list):
        self.parquet_list = new_parquet_list
        if len(self.parquet_list) > 0:
            self.number_of_files_remaining = len(self.parquet_list)
        await self.check_point()
        # print(f"The parquet_list in {self.actor_name} was revised to {self.parquet_list}")

    async def process_parquet_file(self, input_file: str,
                             output_file: str,
                             fixed_batch: bool,
                             scoring_batch: int):
        """
        :param input_file, output_file:
        :return:
        """
        print(f"HAPq processing input_file={input_file} to output_file={output_file}")
        # Here oom refers to GPU out of memory; earlier OOM refers to main memory out of memory
        completed = []
        total_oom = 0
        total_non_oom = 0
        if len(self.parquet_list) == 0:
            self.parquet_list = [input_file]
            # perform a checkpoint of its initial input parquet list when starting anew
            await self.check_point()
            self.number_of_files_remaining = len(self.parquet_list)
            self.initial_checkpoint_written = True

        file_idx = -1
        while len(self.parquet_list) > 0:
            file_idx = file_idx + 1
            p = self.parquet_list.pop(0)
            # adjust for reading a snappy parquet data file
            # start_read_parquet = time.time()
            df = ParquetDataset(p).read().to_pandas()
            # print(f"reading one parquet time: {str(time.time()-start_read_parquet)} seconds")
            # df = dataset.read().to_pandas()
            # df = pd.read_parquet(p)
            (num_rows, num_cols) = df.shape
            prob_df = pd.DataFrame()
            # print(f"----- starting scoring batch size: {scoring_batch}")
            start = 0
            # number of batches before it doubles the scoring_batch after an OOM exception
            if not fixed_batch:
                window = 20
                scaleupwindow = window
                # maintaining a window of the past 5 oom scoring batch_sizes
                oom_scoring_batches = []
            while start < num_rows:
                batch_end = start + scoring_batch
                if batch_end > num_rows:
                    batch_end = num_rows
                print(f"Epoch {file_idx}: {round((start / num_rows) * 100)}%")
                df_batch = df[start:batch_end].get('sentence_text')
                # df_batch = df[start:batch_end].get('text')
                # apply tokenization and scoring for the df_batch to control the memory footprint
                if self.tokenizers_all_same:
                    tokens = list(self.models.values())[0].apply_tokenizer(df_batch)
                batch_prob_df = pd.DataFrame()
                gpu_oom = False
                for curr_colname, curr_model in self.models.items():
                    # print(f"Actor {ray.runtime_context.get_runtime_context().get_actor_id()} "
                    #       f"applying {curr_colname} to {len(input_batch)} "
                    #       f"- GPU allocated {torch.cuda.memory_allocated(0) / 1000000000:.1f}G")
                    if not self.tokenizers_all_same:
                        tokens = curr_model.apply_tokenizer(df_batch)
                    if not fixed_batch:
                        scaleupwindow -= 1
                        if scaleupwindow <= 0:
                            should_increase_batch_size = True
                            for i in range(len(oom_scoring_batches)):
                                if scoring_batch >= oom_scoring_batches[i]/2:
                                    should_increase_batch_size = False
                            if should_increase_batch_size:
                                scoring_batch = int(scoring_batch * 2)
                                # print(f"-- At index: {start} increasing scoring batch size to: {scoring_batch} window: {window}")
                            scaleupwindow = window
                        try:
                            batch_probabilities = curr_model.apply_model(tokens)
                            new_batch_prob_df = pd.DataFrame({curr_colname: batch_probabilities})
                            batch_prob_df = pd.concat([batch_prob_df, new_batch_prob_df], axis=1)
                            total_non_oom += 1
                        except torch.cuda.OutOfMemoryError:
                            if len(oom_scoring_batches) == 5:
                                oom_scoring_batches.pop(0)
                            oom_scoring_batches.append(scoring_batch)
                            total_oom += 1
                            scaleupwindow = window
                            scoring_batch = max(int(scoring_batch / 2), 16)
                            # print(f"--- At index: {start} decreasing scoring batch size to: {scoring_batch} window: {window}")
                            gpu_oom = True
                            break
                    else:
                        batch_probabilities = curr_model.apply_model(tokens)
                        new_batch_prob_df = pd.DataFrame({curr_colname: batch_probabilities})
                        batch_prob_df = pd.concat([batch_prob_df, new_batch_prob_df], axis=1)
                if not fixed_batch and gpu_oom:
                    continue
                prob_df = pd.concat([prob_df, batch_prob_df], ignore_index=True, sort=False)
                start = batch_end
                await asyncio.sleep(0)
                # print(f"**** batch index: {i} prob_df shape: {prob_df.shape}")
            df = pd.concat([df, prob_df], axis=1)
            # filename = Path(p).name
            # f_name_with_input_sub_folder = return_input_sub_folder(input_folder, p)
            file_path = output_file #os.path.join(output_folder, f_name_with_input_sub_folder)
            leaf_dir = os.path.dirname(file_path)
            if not os.path.isdir(leaf_dir):
                try:
                    os.makedirs(leaf_dir)
                except OSError as e:
                    if e.errno != errno.EEXIST:
                        raise
                    pass
            # start_write_parquet = time.time()
            df.to_parquet(file_path)
            await asyncio.sleep(0)
            # print(f"writing one parquet time: {str(time.time() - start_write_parquet)} seconds")
            # print(str(p) + ' processed')
            completed.append(str(p))
            del df
            del prob_df
            # start_checkpoint = time.time()
            await self.check_point()
            self.number_of_files_remaining = len(self.parquet_list)
            # print(f"checkpoint time: {str(time.time() - start_checkpoint)} seconds")
        # Tokens were in the GPU.  See what we can do to get them off again to release memory.
        # This may not be necessary.  Trying to get along without it.
        #   del tokens
        #   gc.collect()
        # print(f"window: {window} total number of oom: {total_oom} total non-oom tries: {total_non_oom}")
        return completed

# default batch size for dynamic scoring batch
DEFAULT_BATCH_SIZE = 128

async def main():
    parser = argparse.ArgumentParser(description='Driver for HAP processing, yo')
    parser.add_argument('input_file', default='/dev/cos/bluepile-processing/v2/dedup_lid_split/dataset=stackexchange/')
    parser.add_argument('output_file', default='/dev/cos/klwu_hap_test/output/')
    parser.add_argument('-m', '--models_folder', default='/dev/cos/hap-models/')
    # if -b or --scoring_batch is set at the command line, then it is the fixed batch size for model scoring
    # if not set, then a dynamic batch size is used.
    parser.add_argument('-b', '--scoring_batch', help='the fixed scoring batch size for tokenization and scoring')

    args = parser.parse_args()
    all_model_paths = {"hap_score": os.path.join(args.models_folder, "IBM_HAP_Distilled_4L_En-selected")}

    actor_name = "HAP"
    checkpoint_file = "/dev/null"
    OOM_revisit_log = "/dev/null"
    actor = ModelMapActor(all_model_paths, True, actor_name, checkpoint_file, OOM_revisit_log)

    if args.scoring_batch is not None:
        fixed_batch = True
        scoring_batch_size = int(args.scoring_batch)
        print(f"fixed scoring batch is used: {scoring_batch_size}")
    else:
        fixed_batch = False
        scoring_batch_size = DEFAULT_BATCH_SIZE
        print(f"dynamic scoring batch is used.")

    await actor.process_parquet_file(
        args.input_file,
        args.output_file,
        fixed_batch,
        scoring_batch_size
    )

if __name__ == "__main__":
    asyncio.run(main())
