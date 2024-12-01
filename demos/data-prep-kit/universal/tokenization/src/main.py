# (C) Copyright IBM Corp. 2024.
# Licensed under the Apache License, Version 2.0 (the “License”);
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an “AS IS” BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
################################################################################

"""
Libraries need to be added to venv:
    transformers==4.35.0
"""

import sys
from os import getenv
import pyarrow.parquet as pq

import time
from argparse import ArgumentParser, Namespace
from typing import Any

import pyarrow as pa
from tokenization_utils import is_valid_argument_string, load_tokenizer, split_text


CHUNK_CHECKPOINT_INTERVAL = 100


"""
This class is used to transform an input table to an output table utilizing a tokenizer.
The input table must contain at least two columns, with default names set as `document_id` and `contents`.
The tokenizer will tokenize each row in `contents` into a sequence of token_ids and write it to `tokens` column
in the output table, along with the document id and token count stored respectively in `document_id`
and `token_count` column.
"""
# Make sure that the param name corresponds to the name used in apply_input_params method
# of TokenizationTransformConfiguration class

tokenizer = getenv("tokenizer", "hf-internal-testing/llama-tokenizer")
tokenizer_args = getenv("tokenizer_args", None)
doc_id_column = getenv("doc_id_column", "document_id")
doc_content_column = getenv("doc_content_column", "contents")
chunk_size = getenv("chunk_size", 0)
text_lang = getenv("text_lang", "en")

# overwrite tokenizer:
tokenizer = load_tokenizer(tokenizer_name=tokenizer, tokenizer_args=tokenizer_args)

def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict[str, Any]]:
    """
    Put Transform-specific to convert one Table to 0 or more tables. It also returns
    a dictionary of execution statistics - arbitrary dictionary
    This implementation makes no modifications so effectively implements a copy of the
    input parquet to the output folder, without modification.
    """
    print(f"Transforming one table with {len(table)} rows using tokenizer {tokenizer}", file=sys.stderr)

    # Tracking token count + document_id for non-empty row/doc:
    token_count = []
    processed_doc_ids = []

    # Track empty document_id of empty rows/docs:
    empty_doc_ids = []

    # num. of tokens per doc/row, eg: [[978, 1923, 313, 317], [317, 4294],...]
    doc_tokens = []

    # document length in #characters:
    doc_lengths = []

    for idx in range(table.num_rows):
        doc_id = table[doc_id_column][idx].as_py()
        doc_content = table[doc_content_column][idx].as_py()
        doc_length = len(doc_content)

        # skip empty document/row:
        if doc_length == 0:
            empty_doc_ids.append(doc_id)
            continue

        try:
            if chunk_size > 0 and doc_length > chunk_size:
                # tokenize document by chunks:
                start_time = time.time()
                token_line = []
                doc_len_so_far = 0
                for chunk_idx, chunk in enumerate(split_text(doc_content, chunk_size)):
                    token_line.extend(tokenizer(chunk)["input_ids"])
                    doc_len_so_far += len(chunk)

                    if (chunk_idx + 1) % CHUNK_CHECKPOINT_INTERVAL == 0 or (doc_len_so_far == doc_length):
                        elapse_time = int(time.time() - start_time)
                        print(
                            f"row_idx: {idx:5,} "
                            f"(doc_id: {doc_id}) "
                            f"chunk_idx: {chunk_idx:6,} ({doc_len_so_far:11,}/{doc_length:11,} "
                            f"{100*doc_len_so_far/doc_length:5.1f}%) #tokens: {len(token_line):9,} "
                            f"elapse_time:{elapse_time: .1f}(s)",
                            file=sys.stderr
                        )
            else:
                token_line = tokenizer(doc_content)["input_ids"]
        except Exception as e:
            # skip failed row/doc, treat it as `empty` and move on:
            logger.warning(f"Failed in tokenizing `{doc_content}` due to:\n {e}")
            empty_doc_ids.append(doc_id)
            continue

        num_tokens = len(token_line)
        # skip document with empty returned tokens:
        if num_tokens == 0:
            empty_doc_ids.append(doc_id)
            continue
        else:
            doc_lengths.append(doc_length)
            doc_tokens.append(token_line)
            processed_doc_ids.append(doc_id)
            token_count.append(num_tokens)

    out_table = pa.table(
        {
            "tokens": doc_tokens,
            doc_id_column: processed_doc_ids,
            "document_length": doc_lengths,
            "token_count": token_count,
        }
    )
    print(f"Done with the transformed table with {table.num_rows:,} rows", file=sys.stderr)

    metadata = {
        "num_files": 1,
        "num_rows": table.num_rows,
        "num_tokenized_rows": out_table.num_rows,
        "num_empty_rows": len(empty_doc_ids),
        "num_tokens": sum(token_count),
        "num_chars": sum(doc_lengths),
    }

    return [out_table], metadata

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

out, metadata = transform(table)
print(f"Done with num_files={metadata['num_files']} num_rows={metadata['num_rows']} num_tokenized_rows={metadata['num_tokenized_rows']} num_empty_rows={metadata['num_empty_rows']} num_tokens={metadata['num_tokens']} num_chars={metadata['num_chars']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
