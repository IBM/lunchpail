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

from argparse import ArgumentParser, Namespace
from typing import Any

import pyarrow as pa
#from data_processing.utils import (
#    LOCAL_TO_DISK,
#    MB,
#    CLIArgumentProvider,
#    UnrecoverableException
#)
LOCAL_TO_DISK = 2
KB = 1024
MB = 1024 * KB
class UnrecoverableException(Exception):
    """
    Raised when a transform wants to cancel overall execution
    Default - skip this file and continue
    """

    pass


max_rows_per_table_key = "max_rows_per_table"
max_mbytes_per_table_key = "max_mbytes_per_table"
size_type_key = "size_type"
shortname = "resize"
cli_prefix = f"{shortname}_"
max_rows_per_table_cli_param = f"{cli_prefix}{max_rows_per_table_key}"
max_mbytes_per_table_cli_param = f"{cli_prefix}{max_mbytes_per_table_key}"
size_type_cli_param = f"{cli_prefix}{size_type_key}"
size_type_disk = "disk"
size_type_memory = "memory"
size_type_default = size_type_disk


"""
Implements splitting large files into smaller ones.
Two flavours of splitting are supported - based on the amount of documents and based on the size
"""

"""
Initialize based on the dictionary of configuration information.
"""
max_rows_per_table = getenv(max_rows_per_table_key, 0)
max_bytes_per_table = MB * getenv(max_mbytes_per_table_key, 0.05)
disk_memory = getenv(size_type_key, size_type_default)
if size_type_default in disk_memory:
    max_bytes_per_table *= LOCAL_TO_DISK

print(f"max bytes = {max_bytes_per_table}", file=sys.stderr)
print(f"max rows = {max_rows_per_table}", file=sys.stderr)
buffer = None
if max_rows_per_table <= 0 and max_bytes_per_table <= 0:
    raise ValueError("Neither max rows per table nor max table size are defined")
if max_rows_per_table > 0 and max_bytes_per_table > 0:
    raise ValueError("Both max rows per table and max table size are defined. Only one should be present")

def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict[str, Any]]:
    """
    split larger files into the smaller ones
    :param table: table
    :param file_name: name of the file
    :return: resulting set of tables
    """
    global buffer
    print(f"got new table with {table.num_rows} rows", file=sys.stderr)
    if buffer is not None:
        try:
            print(
                f"concatenating buffer with {buffer.num_rows} rows to table with {table.num_rows} rows",
                file=sys.stderr
            )
            # table = pa.concat_tables([buffer, table], unicode_promote_options="permissive")
            table = pa.concat_tables([buffer, table])
            buffer = None
            print(f"concatenated table has {table.num_rows} rows", file=sys.stderr)
        except Exception as _:  # Can happen if schemas are different
            # Raise unrecoverable error to stop the execution
            print(f"table in {file_name} can't be merged with the buffer", file=sys.stderr)
            print(f"incoming table columns {table.schema.names} ", file=sys.stderr)
            print(f"buffer columns {buffer.schema.names}", file=sys.stderr)
            raise UnrecoverableException()

    result = []
    start_row = 0
    if max_rows_per_table > 0:
        # split file with max documents
        n_rows = table.num_rows
        rows_left = n_rows
        while start_row < n_rows and rows_left >= max_rows_per_table:
            length = n_rows - start_row
            if length > max_rows_per_table:
                length = max_rows_per_table
            a_slice = table.slice(offset=start_row, length=length)
            print(f"created table slice with {a_slice.num_rows} rows, starting with row {start_row}", file=sys.stderr)
            result.append(a_slice)
            start_row = start_row + max_rows_per_table
            rows_left = rows_left - max_rows_per_table
    else:
        # split based on size
        current_size = 0.0
        if table.nbytes >= max_bytes_per_table:
            for n in range(table.num_rows):
                current_size += table.slice(offset=n, length=1).nbytes
                if current_size >= max_bytes_per_table:
                    print(f"capturing slice, current_size={current_size}", file=sys.stderr)
                    # Reached the size
                    a_slice = table.slice(offset=start_row, length=(n - start_row))
                    result.append(a_slice)
                    start_row = n
                    current_size = 0.0
    if start_row < table.num_rows:
        # buffer remaining chunk for next call
        print(f"Buffering table starting at row {start_row}", file=sys.stderr)
        buffer = table.slice(offset=start_row, length=(table.num_rows - start_row))
        print(f"buffered table has {buffer.num_rows} rows", file=sys.stderr)
    print(f"returning {len(result)} tables", file=sys.stderr)
    return result, {}

def flush() -> tuple[list[pa.Table], dict[str, Any]]:
    global buffer
    result = []
    if buffer is not None:
        print(f"flushing buffered table with {buffer.num_rows} rows of size {buffer.nbytes}", file=sys.stderr)
        result.append(buffer)
        buffer = None
    else:
        print(f"Empty buffer. nothing to flush.", file=sys.stderr)
    return result, {}

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

transform(table)
out, metadata = flush()
print(f"Done. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
