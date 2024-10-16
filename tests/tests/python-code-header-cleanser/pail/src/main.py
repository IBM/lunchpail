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

import os
import sys

import pyarrow.parquet as pq

from header_cleanser_transform import (
    COLUMN_KEY,
    COPYRIGHT_KEY,
    LICENSE_KEY,
    HeaderCleanserTransform,
)

header_cleanser_params = {
    COLUMN_KEY: "contents",
    COPYRIGHT_KEY: True,
    LICENSE_KEY: True,
}

if __name__ == "__main__":
    # Create and configure the transform.
    transform = HeaderCleanserTransform(header_cleanser_params)

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
