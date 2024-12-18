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
import pyarrow.parquet as pq
import pyarrow as pa
import hashlib

from typing import Any
import os
from os import getenv

doc_column = "contents"
hash_column = "hash_column"
int_column = "int_id_column"
start_id_key = "start_id"

class IDGenerator():
    """
    A class maintaining unique integer ids
    """

    def __init__(self, start: int=0):
        """
        Initialization
        :param start: starting id number
        """
        self.id = start

    def get_ids(self, n_rows: int) -> int:
        """
        Give out a new portion of integer ids
        :param n_rows: number of required Ids
        :return: starting value of blocks of ids
        """
        start_id = self.id
        self.id = self.id + n_rows
        return start_id

id_generator =  IDGenerator(getenv(start_id_key, 1))

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

def normalize_string(doc: str) -> str:
    """
    Normalize string
    :param doc: string to normalize
    :return: normalized string
    """
    return doc.replace(" ", "").replace("\n", "").lower().translate(str.maketrans("", "", string.punctuation))

def _get_starting_id(n_rows: int) -> int:
    """
    Get starting ID
    :param n_rows - number of rows in the table
    :return: starting id for the table
    """
    return id_generator.get_ids(n_rows=n_rows)

# Create and configure the transform.
def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict[str, Any]]:
    """
    Put Transform-specific to convert one Table to 0 or more tables. It also returns
    a dictionary of execution statistics - arbitrary dictionary
    This implementation makes no modifications so effectively implements a copy of the
    input parquet to the output folder, without modification.
    """
    validate_columns(table=table, required=[doc_column])

    if hash_column is not None:
        # add doc id column
        docs = table[doc_column]
        doc_ids = [""] * table.num_rows
        for n in range(table.num_rows):
            doc_ids[n] = str_to_hash(docs[n].as_py())
        table = add_column(table=table, name=hash_column, content=doc_ids)
    if int_column is not None:
        # add integer document id
        sid = _get_starting_id(table.num_rows)
        int_doc_ids = list(range(sid, table.num_rows + sid))
        table = add_column(table=table, name=int_column, content=int_doc_ids)
    return [table], {}

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
    print(f"Done Reading in parquet file {sys.argv[1]}")

print(f"input table has {table.num_rows} rows")
# Transform the table
table_list, metadata = transform(table, sys.argv[1])
print(f"\noutput table has {table_list[0].num_rows} rows")
print(f"output metadata : {metadata}")
pq.write_table(table_list[0], sys.argv[2])
