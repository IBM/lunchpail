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
from os import getenv
import pyarrow.parquet as pq

import time
from argparse import ArgumentParser, Namespace
from typing import Any

import pyarrow as pa
from sentence_transformers import SentenceTransformer


short_name = "text_encoder"
cli_prefix = f"{short_name}_"
model_name_key = "model_name"
content_column_name_key = "content_column_name"
output_embeddings_column_name_key = "output_embeddings_column_name"
model_name_cli_param = f"{cli_prefix}{model_name_key}"
content_column_name_cli_param = f"{cli_prefix}{content_column_name_key}"
output_embeddings_column_name_cli_param = f"{cli_prefix}{output_embeddings_column_name_key}"

default_model_name = "BAAI/bge-small-en-v1.5"
default_content_column_name = "contents"
default_output_embeddings_column_name = "embeddings"


""" """
# Make sure that the param name corresponds to the name used in apply_input_params method
# of TextEncoderTransform class
model_name = getenv(model_name_key, default_model_name)
content_column_name = getenv(content_column_name_key, default_content_column_name)
output_embeddings_column_name = getenv(
    output_embeddings_column_name_key, default_output_embeddings_column_name
)

model = SentenceTransformer(model_name)

# This makes the output deterministic, to allow for testing
# https://stackoverflow.com/a/75904917/5270773
model.eval()

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

def add_column(table: pa.Table, name: str, content: list[Any]) -> pa.Table:
    """
    Add column to the table
    :param table: original table
    :param name: column name
    :param content: content of the column
    :return: updated table, containing new column
    """
    # check if column already exist and drop it
    if name in table.schema.names:
        table = table.drop(columns=[name])
    # append column
    return table.append_column(field_=name, column=[content])
    
def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict[str, Any]]:
    """ """
    print(f"Transforming one table with {len(table)} rows", file=sys.stderr)

    # make sure that the content column exists
    validate_columns(table=table, required=[content_column_name])

    embeddings = list(
        map(
            lambda x: model.encode(x, normalize_embeddings=True),
            table[content_column_name].to_pylist(),
        ),
    )
    result = add_column(table=table, name=output_embeddings_column_name, content=embeddings)

    metadata = {"nfiles": 1, "nrows": len(result)}
    return [result], metadata

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

out, metadata = transform(table)
print(f"Done with nfiles={metadata['nfiles']} nrows={metadata['nrows']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
