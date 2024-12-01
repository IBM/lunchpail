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
import hashlib

import io
import json
import os
import uuid
import zipfile
from argparse import ArgumentParser, Namespace
from datetime import datetime
from typing import Any

import pyarrow as pa

def get_file(path: str) -> tuple[bytes, int]:
    """
    Gets the contents of a file as a byte array, decompressing gz files if needed.

    Args:
        path (str): The path to the file.

    Returns:
        bytes: The contents of the file as a byte array, or None if an error occurs.
    """

    try:
        if path.endswith(".gz"):
            with gzip.open(path, "rb") as f:
                data = f.read()
        else:
            with open(path, "rb") as f:
                data = f.read()
        return data, 0

    except (FileNotFoundError, gzip.BadGzipFile) as e:
        logger.error(f"Error reading file {path}: {e}")
        raise e

def get_file_extension(file_path) -> list[str]:
    """
    Get the file's root and extension from the given file path.
    :param file_path : The path of the file.
    :return: str: The file extension including the dot ('.') if present, otherwise an empty string.
    """
    return os.path.splitext(file_path)

def str_to_hash(val: str) -> str:
    """
    compute string hash
    :param val: string
    :return: hash value
    """
    return hashlib.sha256(val.encode("utf-8")).hexdigest()


shortname = "code2parquet"
cli_prefix = f"{shortname}_"

supported_langs_file_key = "supported_langs_file"
supported_langs_file_cli_key = f"{cli_prefix}{supported_langs_file_key}"

supported_languages_key = "supported_languages"
supported_languages_cli_key = f"{cli_prefix}{supported_languages_key}"

detect_programming_lang_key = "detect_programming_lang"
detect_programming_lang_cli_key = f"{cli_prefix}{detect_programming_lang_key}"
detect_programming_lang_default = True

data_factory_key = "data_factory"

domain_key = "domain"
domain_cli_key = f"{cli_prefix}{domain_key}"
snapshot_key = "snapshot"
snapshot_cli_key = f"{cli_prefix}{snapshot_key}"


def get_supported_languages(lang_file: str) -> dict[str, str]:
    print(f"Getting supported languages from file {lang_file}", file=sys.stderr)
    json_data, _ = get_file(lang_file)
    lang_dict = json.loads(json_data.decode("utf-8"))
    reversed_dict = {ext: langs for langs, exts in lang_dict.items() for ext in exts}
    print(f"Supported languages {reversed_dict}", file=sys.stderr)
    return reversed_dict


"""

Args:
    config: dictionary of configuration data
        supported_langs - dictionary of file extenstions to language names.
        supported_langs_file - if supported_langs, is not provided, then read a map
            of language names keyed to a list of extensions, from this json file.  The file is read using
            the DataAccessFactory, under the code2parquet_data_factory key.
"""
languages_supported = getenv(supported_languages_key, None)
if languages_supported is None:
    path = getenv(supported_langs_file_key, None)
    if path is not None:
        languages_supported = get_supported_languages(
            lang_file=path
        )
    detect_programming_lang = getenv(detect_programming_lang_key, detect_programming_lang_default)
    if detect_programming_lang and languages_supported is None:
        raise RuntimeError(
            "Programming language detection requested without providing a mapping of extensions to languages"
        )
domain = getenv(domain_key, None)
snapshot = getenv(domain_key, None)
shared_columns = {}
if domain is not None:
    shared_columns["domain"] = domain
if snapshot is not None:
    shared_columns["snapshot"] = snapshot

def _get_lang_from_ext(ext):
    lang = "unknown"
    if ext is not None:
        lang = languages_supported.get(ext, lang)
    return lang

def transform_binary(file_name: str, byte_array: bytes) -> tuple[list[tuple[bytes, str]], dict[str, Any]]:
    """
    Converts raw data file (ZIP) to Parquet format
    """
    # We currently only process .zip files
    if get_file_extension(file_name)[1] != ".zip":
        print(f"Got unsupported file type {file_name}, skipping", file=sys.stderr)
        return [], {}
    data = []
    number_of_rows = 0
    with zipfile.ZipFile(io.BytesIO(bytes(byte_array))) as opened_zip:
        # Loop through each file member in the ZIP archive
        for member in opened_zip.infolist():
            if not member.is_dir():
                with opened_zip.open(member) as file:
                    try:
                        # Read the content of the file
                        content_bytes = file.read()
                        # Decode the content
                        try:
                            content_string = content_bytes.decode("utf-8")
                        except Exception:
                            content_string = ""
                        if content_string and len(content_string) > 0:
                            ext = get_file_extension(member.filename)[1]
                            row_data = {
                                "title": member.filename,
                                "document": os.path.basename(file_name),
                                "contents": content_string,
                                "document_id": str(uuid.uuid5(uuid.NAMESPACE_URL, content_string)), # v5 for tests
                                "ext": ext,
                                "hash": str_to_hash(content_string),
                                "size": len(content_string),
                                "date_acquired": "disabled_for_tests", # datetime.now().isoformat(),
                                "repo_name": os.path.splitext(os.path.basename(file_name))[0],
                            } | shared_columns
                            if detect_programming_lang:
                                lang = _get_lang_from_ext(ext)
                                row_data["programming_language"] = lang  # TODO column name should be configurable
                            data.append(row_data)
                            number_of_rows += 1
                        else:
                            print(
                                f"file {member.filename} is empty. content {content_string}, skipping",
                                file=sys.stderr
                            )
                    except Exception as e:
                        print(f"Exception {str(e)} processing file {member.filename}, skipping", file=sys.stderr)
    table = pa.Table.from_pylist(data)
    return [table], {"number of rows": number_of_rows}

byte_array, _ = get_file(sys.argv[1])
out, metadata = transform_binary(sys.argv[1], byte_array)
print(f"Done with number_of_rows={metadata['number of rows']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
