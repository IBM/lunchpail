import sys
import os
from os import getenv
import pyarrow.parquet as pq
import hashlib

import enum
import time
from argparse import ArgumentParser, Namespace
from typing import Any
import zipfile
import io
import trafilatura
from datetime import datetime

import pyarrow as pa

# disabled for now
# from data_processing_ray.runtime.ray import RayTransformLauncher
# from data_processing_ray.runtime.ray.runtime_configuration import (
#   RayTransformRuntimeConfiguration,
# )
# import data_processing


short_name = "html2parquet"
cli_prefix = f"{short_name}_"
html2parquet_output_format_key = f"output_format"

class html2parquet_output_format(str, enum.Enum):
    MARKDOWN = "markdown"
    TEXT = "text"

    def __str__(self):
        return str(value)

output_format = getenv(html2parquet_output_format_key, html2parquet_output_format.MARKDOWN)
if not isinstance(output_format, html2parquet_output_format):
    output_format = html2parquet_output_format[output_format]  

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
    
def _convert_html2parquet(member_filename:str, file_name:str, content_bytes: bytes) -> dict:
    title = member_filename if member_filename else os.path.basename(file_name)

    # Use Trafilatura library
    if output_format == html2parquet_output_format.MARKDOWN:
        content_string = trafilatura.extract(content_bytes, output_format="markdown")
    elif output_format == html2parquet_output_format.TEXT:
        content_string = trafilatura.extract(content_bytes)
    else:
        raise RuntimeError(f"Uknown output_format {output_format}.")


    if content_string is None:
        raise RuntimeError("Failed in converting.")

    row_data = {
        "title": title,
        "document": os.path.basename(file_name),
        "contents": content_string,
        "document_id": str_to_hash(content_string),
        "size": len(content_string),
        # hard to test this, disabling for now: "date_acquired": datetime.now().isoformat()
    }

    return row_data

def transform_binary(file_name: str, byte_array: bytes) -> tuple[list[tuple[bytes, str]], dict[str, Any]]:
    """
    Converts raw data file (ZIP) / raw HTMLs to Parquet format

    If file_name is detected as a HTML file, it generates a pyarrow table with a single row
    that contains the document converted to a text string.
    If file_name is detected as a ZIP archive, it generates a pyarrow table with a row
    for each HTML file detected in the archive.
    """
    if get_file_extension(file_name)[1] not in [".zip", ".html"]:
        error_message = f"Unsupported file type: {file_name}. Only ZIP and HTML files are supported."
        print(error_message, file=sys.stderr)
        raise ValueError(error_message)  # Raising an exception with the error message
    data = []
    number_of_rows = 0

    # Process ZIP archive of HTML documents
    if(get_file_extension(file_name)[1] == ".zip"):
        with zipfile.ZipFile(io.BytesIO(bytes(byte_array))) as opened_zip:
            # Loop through each file member in the ZIP archive
            for member in opened_zip.infolist():
                if not member.is_dir() and get_file_extension(member.filename)[1] == ".html":
                    with opened_zip.open(member) as file:
                        try:
                            # Read the content of the file
                            content_bytes = file.read()

                            row_data = _convert_html2parquet(member_filename=member.filename ,file_name=file_name, content_bytes=content_bytes)

                            data.append(row_data)
                            number_of_rows += 1
                        except Exception as e:
                            print(f"Exception {str(e)} processing file {member.filename}, skipping", file=sys.stderr)


    # Process single HTML documents
    elif(get_file_extension(file_name)[1] == ".html"):
        try:
            buf = io.BytesIO(bytes(byte_array))
            # Read the content of the HTML file
            content_bytes = buf.read()

            row_data = _convert_html2parquet(member_filename=None ,file_name=file_name, content_bytes=content_bytes)

            data.append(row_data)
            number_of_rows += 1

        except Exception as e:
            print(f"Exception {str(e)} processing file {file_name}, skipping", file=sys.stderr)


    table = pa.Table.from_pylist(data)
    return [table], {"nrows": number_of_rows}

byte_array, _ = get_file(sys.argv[1])
out, metadata = transform_binary(sys.argv[1], byte_array)
print(f"Done with nrows={metadata['nrows']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])

html2parquet_output_format_default = html2parquet_output_format.MARKDOWN
html2parquet_output_format_cli_param = f"{cli_prefix}{html2parquet_output_format_key}"

