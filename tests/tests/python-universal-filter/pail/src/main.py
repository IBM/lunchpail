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

import ast

import duckdb
import pyarrow as pa


short_name = "filter"
cli_prefix = short_name + "_"

filter_criteria_key = "criteria_list"
""" AST Key holds the list of filter criteria (in SQL WHERE clause format)"""
filter_logical_operator_key = "logical_operator"
""" Key holds the logical operator that joins filter criteria (AND or OR)"""
filter_columns_to_drop_key = "columns_to_drop"
""" AST Key holds the list of columns to drop after filtering"""

filter_criteria_cli_param = f"{cli_prefix}{filter_criteria_key}"
""" AST Key holds the list of filter criteria (in SQL WHERE clause format)"""
filter_logical_operator_cli_param = f"{cli_prefix}{filter_logical_operator_key}"
""" Key holds the logical operator that joins filter criteria (AND or OR)"""
filter_columns_to_drop_cli_param = f"{cli_prefix}{filter_columns_to_drop_key}"
""" AST Key holds the list of columns to drop after filtering"""

captured_arg_keys = [filter_criteria_key, filter_columns_to_drop_key]
""" The set of keys captured from the command line """

# defaults
filter_criteria_default = ast.literal_eval("[]")
""" The default list of filter criteria (in SQL WHERE clause format)"""
filter_logical_operator_default = "AND"
filter_columns_to_drop_default = ast.literal_eval("[]")
""" The default list of columns to drop"""


"""
Implements filtering - select from a pyarrow.Table a set of rows that
satisfy a set of filtering criteria
"""

"""
Initialize based on the dictionary of configuration information.
This is generally called with configuration parsed from the CLI arguments defined
by the companion runtime, FilterTransformRuntime.  If running from the Ray orchestrator,
these will be provided by that class with help from the RayMutatingDriver.
"""
filter_criteria = getenv(filter_criteria_key, filter_criteria_default)
logical_operator = getenv(filter_logical_operator_key, filter_logical_operator_default)
columns_to_drop = getenv(filter_columns_to_drop_key, filter_columns_to_drop_default)

def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict]:
    """
    This implementation filters the input table using a SQL statement and
    returns the filtered table and execution stats
    :param table: input table
    :return: list of output tables and custom statistics
    """

    # move table under a different name, to avoid SQL query parsing error
    input_table = table
    total_docs = input_table.num_rows
    total_columns = input_table.num_columns
    total_bytes = input_table.nbytes

    # initialize the metadata dictionary
    metadata = {
        "total_docs_count": total_docs,
        "total_bytes_count": total_bytes,
        "total_columns_count": total_columns,
    }

    # initialize the SQL statement used for filtering
    sql_statement = "SELECT * FROM input_table"
    if len(filter_criteria) > 0:
        # populate metadata with filtering stats for each filter criterion
        for filter_criterion in filter_criteria:
            criterion_sql = f"{sql_statement} WHERE {filter_criterion}"
            filter_table = duckdb.execute(criterion_sql).arrow()
            docs_filtered = total_docs - filter_table.num_rows
            bytes_filtered = total_bytes - filter_table.nbytes
            metadata[f"docs_filtered_out_by '{filter_criterion}'"] = docs_filtered
            metadata[f"bytes_filtered_out_by '{filter_criterion}'"] = bytes_filtered

        # use filtering criteria to build the SQL query for filtering
        filter_clauses = [f"({x})" for x in filter_criteria]
        where_clause = f" {logical_operator} ".join(filter_clauses)
        sql_statement = f"{sql_statement} WHERE {where_clause}"

        # filter using SQL statement
        try:
            filtered_table = duckdb.execute(sql_statement).arrow()
        except Exception as ex:
            logger.error(f"FilterTransform::transform failed: {ex}")
            raise ex
    else:
        filtered_table = table

    # drop any columns requested from the final result
    if len(columns_to_drop) > 0:
        filtered_table_cols_dropped = filtered_table.drop_columns(columns_to_drop)
    else:
        filtered_table_cols_dropped = filtered_table

    # add global filter stats to metadata
    metadata["docs_after_filter"] = filtered_table.num_rows
    metadata["columns_after_filter"] = filtered_table_cols_dropped.num_columns
    metadata["bytes_after_filter"] = filtered_table.nbytes

    return [filtered_table_cols_dropped], metadata

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

out, metadata = transform(table)
print(f"Done with docs_after_filter={metadata['docs_after_filter']} columns_after_filter={metadata['columns_after_filter']} bytes_after_filter={metadata['bytes_after_filter']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
