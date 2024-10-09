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

import os

from data_processing.data_access import DataAccessLocal
from doc_id_transform_python import DocIDTransform
from doc_id_transform_base import (IDGenerator,
                                   doc_column_name_key,
                                   hash_column_name_key,
                                   int_column_name_key,
                                   id_generator_key,
                                   )

doc_id_params = {doc_column_name_key: "contents",
                 hash_column_name_key: "hash_column",
                 int_column_name_key: "int_id_column",
                 id_generator_key: IDGenerator(5),
                 }
doc_column_name_key = "doc_column"
hash_column_name_key = "hash_column"
int_column_name_key = "int_column"
start_id_key = "start_id"

if __name__ == "__main__":
    # Create and configure the transform.
    transform = DocIDTransform(doc_id_params)

    try:
        print(f"Reading in parquet file {sys.argv[1]}")
        table = pq.read_table(sys.argv[1])
    except Exception as e:
        print(f"Error reading table: {e}", file=sys.stderr)
        exit(1)
        print(f"Done Reading in parquet file {sys.argv[1]}")

    print(f"input table has {table.num_rows} rows")
    # Transform the table
    table_list, metadata = transform.transform(table)
    print(f"\noutput table has {table_list[0].num_rows} rows")
    print(f"output metadata : {metadata}")
    pq.write_table(table_list[0], sys.argv[2])
