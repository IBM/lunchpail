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

import sys
from os import getenv, path
import pyarrow.parquet as pq
import hashlib
from pathlib import Path

import enum
import time
from typing import Any

import pyarrow as pa
from doc_chunk_chunkers import ChunkingExecutor, DLJsonChunker, LIMarkdown


short_name = "doc_chunk"
cli_prefix = f"{short_name}_"
content_column_name_key = "content_column_name"
doc_id_column_name_key = "doc_id_column_name"
chunking_type_key = "chunking_type"
dl_min_chunk_len_key = "dl_min_chunk_len"
output_chunk_column_name_key = "output_chunk_column_name"
output_source_doc_id_column_name_key = "output_source_doc_id_column_name"
output_jsonpath_column_name_key = "output_jsonpath_column_name"
output_pageno_column_name_key = "output_pageno_column_name"
output_bbox_column_name_key = "output_bbox_column_name"
content_column_name_cli_param = f"{cli_prefix}{content_column_name_key}"
doc_id_column_name_cli_param = f"{cli_prefix}{doc_id_column_name_key}"
chunking_type_cli_param = f"{cli_prefix}{chunking_type_key}"
dl_min_chunk_len_cli_param = f"{cli_prefix}{dl_min_chunk_len_key}"
output_chunk_column_name_cli_param = f"{cli_prefix}{output_chunk_column_name_key}"
output_source_doc_id_column_name_cli_param = f"{cli_prefix}{output_source_doc_id_column_name_key}"
output_jsonpath_column_name_cli_param = f"{cli_prefix}{output_jsonpath_column_name_key}"
output_pageno_column_name_cli_param = f"{cli_prefix}{output_pageno_column_name_key}"
output_bbox_column_name_cli_param = f"{cli_prefix}{output_bbox_column_name_key}"


class chunking_types(str, enum.Enum):
    LI_MARKDOWN = "li_markdown"
    DL_JSON = "dl_json"

    def __str__(self):
        return str(self.value)


default_content_column_name = "contents"
default_doc_id_column_name = "document_id"
default_chunking_type = chunking_types.DL_JSON
default_dl_min_chunk_len = None
default_output_chunk_column_name = "contents"
default_output_source_doc_id_column_name = "source_document_id"
default_output_jsonpath_column_name = "doc_jsonpath"
default_output_pageno_column_name = "page_number"
default_output_bbox_column_name = "bbox"


"""
Implements a simple copy of a pyarrow Table.
"""

"""
Initialize based on the dictionary of configuration information.
This is generally called with configuration parsed from the CLI arguments defined
by the companion runtime, DocChunkTransformRuntime.  If running inside the RayMutatingDriver,
these will be provided by that class with help from the RayMutatingDriver.
"""
# Make sure that the param name corresponds to the name used in apply_input_params method
# of DocChunkTransformConfiguration class
chunking_type = getenv(chunking_type_key, default_chunking_type)

content_column_name = getenv(content_column_name_key, default_content_column_name)
doc_id_column_name = getenv(doc_id_column_name_key, default_doc_id_column_name)
output_chunk_column_name = getenv(output_chunk_column_name_key, default_output_chunk_column_name)
output_source_doc_id_column_name = getenv(output_source_doc_id_column_name_key, default_output_source_doc_id_column_name)

# Parameters for Docling JSON chunking
dl_min_chunk_len = getenv(dl_min_chunk_len_key, default_dl_min_chunk_len)
output_jsonpath_column_name = getenv(
    output_jsonpath_column_name_key, default_output_jsonpath_column_name
)
output_pageno_column_name_key = getenv(
    output_pageno_column_name_key, default_output_pageno_column_name
)
output_bbox_column_name_key = getenv(output_bbox_column_name_key, default_output_bbox_column_name)

# Initialize chunker

if chunking_type == chunking_types.DL_JSON:
    chunker = DLJsonChunker(
        min_chunk_len=dl_min_chunk_len,
        output_chunk_column_name=output_chunk_column_name,
        output_jsonpath_column_name=output_jsonpath_column_name,
        output_pageno_column_name_key=output_pageno_column_name_key,
        output_bbox_column_name_key=output_bbox_column_name_key,
    )
elif chunking_type == chunking_types.LI_MARKDOWN:
    chunker = LIMarkdown(
        output_chunk_column_name=output_chunk_column_name,
    )
else:
    raise RuntimeError(f"{chunking_type=} is not valid.")

def validate_columns(table: pa.Table, required: list[str]) -> None:
    """
    Check if required columns exist in the table
    :param table: table
    :param required: list of required columns
    :return: None
    """
    columns = table.schema.names
    result = True
    for r in required:
        if r not in columns:
            result = False
            break
    if not result:
        raise Exception(
            f"Not all required columns are present in the table - " f"required {required}, present {columns}"
        )

def str_to_hash(val: str) -> str:
    """
    compute string hash
    :param val: string
    :return: hash value
    """
    return hashlib.sha256(val.encode("utf-8")).hexdigest()
    
def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict[str, Any]]:
    """ """
    print(f"Transforming one table with {len(table)} rows", file=sys.stderr)

    # make sure that the content column exists
    validate_columns(table=table, required=[content_column_name])

    data = []
    for batch in table.to_batches():
        for row in batch.to_pylist():
            content: str = row[content_column_name]
            new_row = {k: v for k, v in row.items() if k not in (content_column_name, doc_id_column_name)}
            if doc_id_column_name in row:
                new_row[output_source_doc_id_column_name] = row[doc_id_column_name]
            for chunk in chunker.chunk(content):
                chunk[doc_id_column_name] = str_to_hash(chunk[output_chunk_column_name])
                data.append(
                    {
                        **new_row,
                        **chunk,
                    }
                )

    table = pa.Table.from_pylist(data)
    metadata = {
        "nfiles": 1,
        "nrows": len(table),
    }
    return [table], metadata

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

outs, metadata = transform(table)
print(f"Done with nfiles={metadata['nfiles']} nrows={metadata['nrows']}. Writing output to directory {sys.argv[3]}")
idx=0
for out in outs:
    pq.write_table(out, path.join(sys.argv[3], Path(sys.argv[1]).stem)+"_"+str(idx)+".parquet")
    idx = idx + 1
