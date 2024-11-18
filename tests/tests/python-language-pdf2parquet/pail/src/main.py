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
import os
from os import getenv
import pyarrow.parquet as pq
import hashlib
import fcntl

import enum
import io
import json
import time
import uuid
import zipfile
from argparse import ArgumentParser, Namespace
from datetime import datetime
from pathlib import Path
from typing import Any

import filetype
import pandas as pd
import pyarrow as pa
from docling.datamodel.base_models import DocumentStream
from docling.datamodel.document import ConvertedDocument, DocumentConversionInput
from docling.document_converter import DocumentConverter
from docling.pipeline.standard_model_pipeline import PipelineOptions


shortname = "pdf2parquet"
cli_prefix = f"{shortname}_"
pdf2parquet_artifacts_path_key = f"artifacts_path"
pdf2parquet_contents_type_key = f"contents_type"
pdf2parquet_do_table_structure_key = f"do_table_structure"
pdf2parquet_do_ocr_key = f"do_ocr"
pdf2parquet_double_precision_key = f"double_precision"


class pdf2parquet_contents_types(str, enum.Enum):
    MARKDOWN = "text/markdown"
    JSON = "application/json"

    def __str__(self):
        return str(self.value)


pdf2parquet_contents_type_default = pdf2parquet_contents_types.MARKDOWN
pdf2parquet_do_table_structure_default = True
pdf2parquet_do_ocr_default = True
pdf2parquet_double_precision_default = 8

pdf2parquet_artifacts_path_cli_param = f"{cli_prefix}{pdf2parquet_artifacts_path_key}"
pdf2parquet_contents_type_cli_param = f"{cli_prefix}{pdf2parquet_contents_type_key}"
pdf2parquet_do_table_structure_cli_param = (
    f"{cli_prefix}{pdf2parquet_do_table_structure_key}"
)
pdf2parquet_do_ocr_cli_param = f"{cli_prefix}{pdf2parquet_do_ocr_key}"
pdf2parquet_double_precision_cli_param = (
    f"{cli_prefix}{pdf2parquet_double_precision_key}"
)

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

def str_to_hash(val: str) -> str:
    """
    compute string hash
    :param val: string
    :return: hash value
    """
    return hashlib.sha256(val.encode("utf-8")).hexdigest()
    
"""
Initialize based on the dictionary of configuration information.
This is generally called with configuration parsed from the CLI arguments defined
by the companion runtime, LangSelectorTransformRuntime.  If running inside the RayMutatingDriver,
these will be provided by that class with help from the RayMutatingDriver.
"""
artifacts_path = getenv(pdf2parquet_artifacts_path_key, None)
if artifacts_path is not None:
    artifacts_path = Path(artifacts_path)
contents_type = getenv(
    pdf2parquet_contents_type_key, pdf2parquet_contents_types.MARKDOWN
)
if not isinstance(contents_type, pdf2parquet_contents_types):
    contents_type = pdf2parquet_contents_types[contents_type]
do_table_structure = getenv(
    pdf2parquet_do_table_structure_key, pdf2parquet_do_table_structure_default
)
do_ocr = getenv(pdf2parquet_do_ocr_key, pdf2parquet_do_ocr_default)
double_precision = getenv(
    pdf2parquet_double_precision_key, pdf2parquet_double_precision_default
)

print("Initializing models", file=sys.stderr)
pipeline_options = PipelineOptions(
    do_table_structure=do_table_structure,
    do_ocr=do_ocr,
)
with open(sys.argv[4], "a") as file:
    # Acquire exclusive lock on the file
    fcntl.flock(file.fileno(), fcntl.LOCK_EX)

    # re: the protecting lock see https://github.com/JaidedAI/EasyOCR/issues/1335
    _converter = DocumentConverter(
        artifacts_path=artifacts_path, pipeline_options=pipeline_options
    )

    # Release the lock
    fcntl.flock(file.fileno(), fcntl.LOCK_UN)

def _update_metrics(num_pages: int, elapse_time: float):
    # This is implemented in the ray version
    pass

def _convert_pdf2parquet(
    doc_filename: str, ext: str, content_bytes: bytes
) -> dict:
    # Convert PDF to Markdown
    start_time = time.time()
    buf = io.BytesIO(content_bytes)
    input_docs = DocumentStream(filename=doc_filename, stream=buf)
    input = DocumentConversionInput.from_streams([input_docs])

    converted_docs = _converter.convert(input)
    doc: ConvertedDocument = next(converted_docs, None)
    if doc is None or doc.output is None:
        raise RuntimeError("Failed in converting.")
    elapse_time = time.time() - start_time

    if contents_type == pdf2parquet_contents_types.MARKDOWN:
        content_string = doc.render_as_markdown()
    elif contents_type == pdf2parquet_contents_types.JSON:
        content_string = pd.io.json.ujson_dumps(
            doc.render_as_dict(), double_precision=double_precision
        )
    else:
        raise RuntimeError(f"Uknown contents_type {contents_type}.")
    num_pages = len(doc.pages)
    num_tables = len(doc.output.tables) if doc.output.tables is not None else 0
    num_doc_elements = len(doc.output.main_text) if doc.output.main_text is not None else 0

    _update_metrics(num_pages=num_pages, elapse_time=elapse_time)

    file_data = {
        "filename": os.path.basename(doc_filename),
        "contents": content_string,
        "num_pages": num_pages,
        "num_tables": num_tables,
        "num_doc_elements": num_doc_elements,
        # commented out for tests "document_id": str(uuid.uuid4()),
        "ext": ext,
        "hash": str_to_hash(content_string),
        "size": len(content_string),
        # commented out for tests "date_acquired": datetime.now().isoformat(),
        # commented out for tests "pdf_convert_time": elapse_time,
    }

    return file_data

def transform_binary(
    file_name: str, byte_array: bytes
) -> tuple[list[tuple[bytes, str]], dict[str, Any]]:
    """
    If file_name is detected as a PDF file, it generates a pyarrow table with a single row
    containing the document converted in markdown format.
    If file_name is detected as a ZIP archive, it generates a pyarrow table with a row
    for each PDF file detected in the archive.
    """

    data = []
    success_doc_id = []
    failed_doc_id = []
    skipped_doc_id = []
    number_of_rows = 0

    try:
        root_kind = filetype.guess(byte_array)

        # Process single PDF documents
        if root_kind is not None and root_kind.mime == "application/pdf":
            print(f"Detected root file {file_name=} as PDF.", file=sys.stderr)

            try:
                root_ext = root_kind.extension
                file_data = _convert_pdf2parquet(
                    doc_filename=file_name, ext=root_ext, content_bytes=byte_array
                )

                file_data["source_filename"] = os.path.basename(
                    file_name
                )

                data.append(file_data)
                number_of_rows += 1
                success_doc_id.append(file_name)

            except Exception as e:
                failed_doc_id.append(file_name)
                print(
                    f"Exception {str(e)} processing file {archive_doc_filename}, skipping",
                    file=sys.stderr
                )

        # Process ZIP archive of PDF documents
        elif root_kind is not None and root_kind.mime == "application/zip":
            print(
                f"Detected root file {file_name=} as ZIP. Iterating through the archive content.",
                file=sys.stderr
            )

            with zipfile.ZipFile(io.BytesIO(byte_array)) as opened_zip:
                zip_namelist = opened_zip.namelist()

                for archive_doc_filename in zip_namelist:

                    print("Processing " f"{archive_doc_filename=} ", file=sys.stderr)

                    with opened_zip.open(archive_doc_filename) as file:
                        try:
                            # Read the content of the file
                            content_bytes = file.read()

                            # Detect file type
                            kind = filetype.guess(content_bytes)
                            if kind is None or kind.mime != "application/pdf":
                                print(
                                    f"File {archive_doc_filename=} is not detected as PDF but {kind=}. Skipping.",
                                    file=sys.stderr
                                )
                                skipped_doc_id.append(archive_doc_filename)
                                continue

                            ext = kind.extension

                            file_data = _convert_pdf2parquet(
                                doc_filename=archive_doc_filename,
                                ext=ext,
                                content_bytes=content_bytes,
                            )
                            file_data["source_filename"] = (
                                os.path.basename(file_name)
                            )

                            data.append(file_data)
                            success_doc_id.append(archive_doc_filename)
                            number_of_rows += 1

                        except Exception as e:
                            failed_doc_id.append(archive_doc_filename)
                            print(
                                f"Exception {str(e)} processing file {archive_doc_filename}, skipping",
                                file=sys.stderr
                            )

        else:
            print(
                f"File {file_name=} is not detected as PDF nor as ZIP but {kind=}. Skipping.",
                file=sys.stderr
            )

        table = pa.Table.from_pylist(data)
        metadata = {
            "nrows": len(table),
            "nsuccess": len(success_doc_id),
            "nfail": len(failed_doc_id),
            "nskip": len(skipped_doc_id),
        }
        return [table], metadata
    except Exception as e:
        print(f"Fatal error with file {file_name=}. No results produced.", file=sys.stderr)
        raise

byte_array, _ = get_file(sys.argv[1])
out, metadata = transform_binary(sys.argv[1], byte_array)
print(f"Done with nrows={metadata['nrows']} nsuccess={metadata['nsuccess']} nfail={metadata['nfail']} nskip={metadata['nskip']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
