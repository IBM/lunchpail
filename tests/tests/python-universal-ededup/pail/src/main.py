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
from ededup_transform_base import HashFilter
from ededup_transform_python import EdedupTransform
from ededup_transform_base import doc_column_name_key, int_column_name_key


ededup_params = {doc_column_name_key: os.getenv("contents", "contents"), int_column_name_key: os.getenv("document_id", "document_id"), "filter": HashFilter({})}

if __name__ == "__main__":
    # Here we show how to run outside of ray
    # Filter transform needs a DataAccess to ready the domain list.
    transform = EdedupTransform(ededup_params)

    try:
        print(f"Reading in parquet file {sys.argv[1]}")
        table = pq.read_table(sys.argv[1])
    except Exception as e:
        print(f"Error reading table: {e}", file=sys.stderr)
        exit(1)
        print(f"Done Reading in parquet file {sys.argv[1]}")

    print(f"input table has {table.num_rows} rows and {table.num_columns} columns")
    # Transform the table
    table_list, metadata = transform.transform(table)
    print(f"\noutput table has {table_list[0].num_rows} rows and {table_list[0].num_columns} columns")
    print(f"output metadata : {metadata}")
