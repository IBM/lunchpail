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
import tempfile
from argparse import ArgumentParser, Namespace

import pyarrow as pa
from scancode import api

short_name = "header_cleanser"
cli_prefix = short_name + "_"
COLUMN_KEY = "contents_column_name"
LICENSE_KEY = "license"
COPYRIGHT_KEY = "copyright"

column_cli_params = f"{cli_prefix}{COLUMN_KEY}"
license_cli_params = f"{cli_prefix}{LICENSE_KEY}"
copyright_cli_params = f"{cli_prefix}{COPYRIGHT_KEY}"

DEFAULT_COLUMN = "contents"
DEFAULT_LICENSE = True
DEFAULT_COPYRIGHT = True

def str2bool(value: str) -> bool:
    """
    Convert string to boolean. Helper for getting boolean parameters
    :param value - input string
    """
    if value.strip().lower() in ("yes", "true", "t", "y", "1"):
        return True
    return False

def file_generate(content):
    """
    Generate temporary file so that it can be passed to scancode-toolkit.
    """
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as temp_file:
            temp_file.write(content.encode("utf-8"))
            temp_file_path = temp_file.name
    except Exception as e:
        print(f"Failed to create file : {e}")
    return temp_file_path


def fetch_index(dict_data):
    """
    Extract License and copyright start and endline from dictonary
    """
    ignore_lines = []
    if dict_data.get("license_detections") != None:
        for licenses in dict_data.get("license_detections"):
            for match in licenses.get("matches"):
                start_line = match["start_line"] - 1
                end_line = match["end_line"] - 1
                ignore_lines.extend([i for i in range(start_line, end_line + 1)])

    if dict_data.get("copyrights") != None:
        for copyrights in dict_data.get("copyrights"):
            start_line = copyrights.get("start_line") - 1
            end_line = copyrights.get("end_line") - 1
            ignore_lines.extend([i for i in range(start_line, end_line + 1)])

    return ignore_lines


def check_empty_comment(code, ignore_lines):
    min_index = min(ignore_lines)
    max_index = max(ignore_lines)
    code_list = code.split("\n")
    if min_index != 0:
        min_index = min_index - 1

    if max_index <= len(code_list):
        max_index = max_index + 2

    for index in range(min_index, max_index):
        if all(
            not isinstance(x, (int, float, complex))
            and not isinstance(x, str)
            or (isinstance(x, str) and not x.isalnum())
            for x in code_list[index]
        ):
            if index not in ignore_lines:
                ignore_lines.append(index)

    return ignore_lines


def remove_copyright(code):
    """
    Using scancode.api function to detecte and remove copyright.
    """
    file_path = file_generate(content=code)
    copyright_dict = api.get_copyrights(file_path)
    os.remove(file_path)
    ignore_lines = fetch_index(copyright_dict)
    if ignore_lines != []:
        modified_code = "\n".join([line for i, line in enumerate(code.split("\n"), 0) if i not in ignore_lines])
        return modified_code, ignore_lines != []
    else:
        return code, False


def remove_license(code):
    """
    Using scancode.api function to detecte and remove license.
    """
    file_path = file_generate(content=code)
    license_dict = api.get_licenses(file_path)
    os.remove(file_path)
    ignore_lines = fetch_index(license_dict)
    if ignore_lines != []:
        modified_code = "\n".join([line for i, line in enumerate(code.split("\n"), 0) if i not in ignore_lines])
        return modified_code, ignore_lines != []
    else:
        return code, False


def remove_license_copyright(code):

    file_path = file_generate(code)
    copyright_dict = api.get_copyrights(file_path)
    license_dict = api.get_licenses(file_path)
    os.remove(file_path)
    ignore_lines_license = fetch_index(license_dict)
    ignore_lines_copyright = fetch_index(copyright_dict)
    ignore_lines = ignore_lines_license + ignore_lines_copyright
    if ignore_lines != []:
        ignore_lines = check_empty_comment(code, ignore_lines)
        modified_code = "\n".join([line for i, line in enumerate(code.split("\n"), 0) if i not in ignore_lines])
        return modified_code, True
    else:
        return code, False

def add_input_params(self, parser: ArgumentParser) -> None:
    parser.add_argument(
        f"--{column_cli_params}",
        required=False,
        type=str,
        default=f"{DEFAULT_COLUMN}",
        help="Name of the column holds the data to process",
    )
    parser.add_argument(
        f"--{license_cli_params}",
        required=False,
        type=lambda x: bool(str2bool(x)),
        default=f"{DEFAULT_LICENSE}",
        help="Set False if license should not be removed",
    )
    parser.add_argument(
        f"--{copyright_cli_params}",
        required=False,
        type=lambda x: bool(str2bool(x)),
        default=f"{DEFAULT_COPYRIGHT}",
        help="Set False if copyright should not be removed ",
    )

def apply_input_params(self, args: Namespace) -> bool:
    captured = CLIArgumentProvider.capture_parameters(args, cli_prefix, False)
    params = params | captured
    return True

column_name = "contents"
license_remove = True
copyright_remove = True

if __name__ == "__main__":
    # Create and configure the transform.
    def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict]:
        contents = table.column(column_name).to_pylist()
        updated_content = []
        remove_code_count = 0
        for content in contents:
            if license_remove and copyright_remove:
                new_content, detect = remove_license_copyright(content)
                if detect:
                    remove_code_count += 1
                updated_content.append(new_content)

            elif copyright_remove:
                new_content, detect = remove_copyright(content)
                if detect:
                    remove_code_count += 1
                updated_content.append(new_content)

            elif license_remove:
                new_content, detect = remove_license(content)
                if detect:
                    remove_code_count += 1
                updated_content.append(new_content)

            else:
                return [table], {"Removed code count": remove_code_count}

        updated_content = pa.array(updated_content)

        table = table.set_column(table.column_names.index(column_name), column_name, updated_content)

        return [table], {"Removed code count": remove_code_count}

    try:
        print(f"Reading in parquet file {sys.argv[1]}")
        table = pq.read_table(sys.argv[1])
    except Exception as e:
        print(f"Error reading table: {e}", file=sys.stderr)
        exit(1)
        print(f"Done Reading in parquet file {sys.argv[1]}")

    print(f"input table has {table.num_rows} rows")
    # Transform the table
    table_list, metadata = transform(table)
    print(f"\noutput table has {table_list[0].num_rows} rows")
    print(f"output metadata : {metadata}")
    pq.write_table(table_list[0], sys.argv[2])
