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
from typing import Any, Optional

import filetype
import pandas as pd
import pyarrow as pa
import numpy as np
#from data_processing.transform import AbstractBinaryTransform, TransformConfiguration
#from data_processing.utils import TransformUtils, get_logger, str2bool
#from data_processing.utils.cli_utils import CLIArgumentProvider
#from data_processing.utils.multilock import MultiLock
from docling.backend.docling_parse_backend import DoclingParseDocumentBackend
from docling.backend.docling_parse_v2_backend import DoclingParseV2DocumentBackend
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import DocumentStream, MimeTypeToFormat
from docling.datamodel.pipeline_options import (
    EasyOcrOptions,
    OcrOptions,
    PdfPipelineOptions,
    TesseractCliOcrOptions,
    TesseractOcrOptions,
)
from docling.document_converter import DocumentConverter, InputFormat, PdfFormatOption
from docling.models.base_ocr_model import OcrOptions


#logger = get_logger(__name__)
# logger = get_logger(__name__, level="DEBUG")

shortname = "pdf2parquet"
cli_prefix = f"{shortname}_"
pdf2parquet_batch_size_key = f"batch_size"
pdf2parquet_artifacts_path_key = f"artifacts_path"
pdf2parquet_contents_type_key = f"contents_type"
pdf2parquet_do_table_structure_key = f"do_table_structure"
pdf2parquet_do_ocr_key = f"do_ocr"
pdf2parquet_ocr_engine_key = f"ocr_engine"
pdf2parquet_bitmap_area_threshold_key = f"bitmap_area_threshold"
pdf2parquet_pdf_backend_key = f"pdf_backend"
pdf2parquet_double_precision_key = f"double_precision"


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

class pdf2parquet_contents_types(str, enum.Enum):
    MARKDOWN = "text/markdown"
    TEXT = "text/plain"
    JSON = "application/json"

    def __str__(self):
        return str(self.value)


class pdf2parquet_pdf_backend(str, enum.Enum):
    PYPDFIUM2 = "pypdfium2"
    DLPARSE_V1 = "dlparse_v1"
    DLPARSE_V2 = "dlparse_v2"

    def __str__(self):
        return str(self.value)


class pdf2parquet_ocr_engine(str, enum.Enum):
    EASYOCR = "easyocr"
    TESSERACT_CLI = "tesseract_cli"
    TESSERACT = "tesseract"

    def __str__(self):
        return str(self.value)


pdf2parquet_batch_size_default = -1
pdf2parquet_contents_type_default = pdf2parquet_contents_types.MARKDOWN
pdf2parquet_do_table_structure_default = True
pdf2parquet_do_ocr_default = True
pdf2parquet_bitmap_area_threshold_default = 0.05
pdf2parquet_ocr_engine_default = pdf2parquet_ocr_engine.EASYOCR
pdf2parquet_pdf_backend_default = pdf2parquet_pdf_backend.DLPARSE_V2
pdf2parquet_double_precision_default = 8

pdf2parquet_batch_size_cli_param = f"{cli_prefix}{pdf2parquet_batch_size_key}"
pdf2parquet_artifacts_path_cli_param = f"{cli_prefix}{pdf2parquet_artifacts_path_key}"
pdf2parquet_contents_type_cli_param = f"{cli_prefix}{pdf2parquet_contents_type_key}"
pdf2parquet_do_table_structure_cli_param = (
    f"{cli_prefix}{pdf2parquet_do_table_structure_key}"
)
pdf2parquet_do_ocr_cli_param = f"{cli_prefix}{pdf2parquet_do_ocr_key}"
pdf2parquet_bitmap_area_threshold__cli_param = (
    f"{cli_prefix}{pdf2parquet_bitmap_area_threshold_key}"
)
pdf2parquet_ocr_engine_cli_param = f"{cli_prefix}{pdf2parquet_ocr_engine_key}"
pdf2parquet_pdf_backend_cli_param = f"{cli_prefix}{pdf2parquet_pdf_backend_key}"
pdf2parquet_double_precision_cli_param = (
    f"{cli_prefix}{pdf2parquet_double_precision_key}"
)


"""
Initialize based on the dictionary of configuration information.
This is generally called with configuration parsed from the CLI arguments defined
by the companion runtime, LangSelectorTransformRuntime.  If running inside the RayMutatingDriver,
these will be provided by that class with help from the RayMutatingDriver.
"""

batch_size = getenv(pdf2parquet_batch_size_key, pdf2parquet_batch_size_default)
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
ocr_engine_name = getenv(
    pdf2parquet_ocr_engine_key, pdf2parquet_ocr_engine_default
)
if not isinstance(ocr_engine_name, pdf2parquet_ocr_engine):
    ocr_engine_name = pdf2parquet_ocr_engine[ocr_engine_name]
bitmap_area_threshold = getenv(
    pdf2parquet_bitmap_area_threshold_key,
    pdf2parquet_bitmap_area_threshold_default,
)
pdf_backend_name = getenv(
    pdf2parquet_pdf_backend_key, pdf2parquet_pdf_backend_default
)
if not isinstance(pdf_backend_name, pdf2parquet_pdf_backend):
    pdf_backend_name = pdf2parquet_pdf_backend[pdf_backend_name]
double_precision = getenv(
    pdf2parquet_double_precision_key, pdf2parquet_double_precision_default
)

def _get_ocr_engine(engine_name: pdf2parquet_ocr_engine) -> OcrOptions:
    if engine_name == pdf2parquet_ocr_engine.EASYOCR:
        return EasyOcrOptions()
    elif engine_name == pdf2parquet_ocr_engine.TESSERACT_CLI:
        return TesseractCliOcrOptions()
    elif engine_name == pdf2parquet_ocr_engine.TESSERACT:
        return TesseractOcrOptions()

    raise RuntimeError(f"Unknown OCR engine `{engine_name}`")

def _get_pdf_backend(backend_name: pdf2parquet_pdf_backend):
    if backend_name == pdf2parquet_pdf_backend.DLPARSE_V1:
        return DoclingParseDocumentBackend
    elif backend_name == pdf2parquet_pdf_backend.DLPARSE_V2:
        return DoclingParseV2DocumentBackend
    elif backend_name == pdf2parquet_pdf_backend.PYPDFIUM2:
        return PyPdfiumDocumentBackend

    raise RuntimeError(f"Unknown PDF backend `{backend_name}`")

print("Initializing models")
pipeline_options = PdfPipelineOptions(
    artifacts_path=artifacts_path,
    do_table_structure=do_table_structure,
    do_ocr=do_ocr,
    ocr_options=_get_ocr_engine(ocr_engine_name),
)
pipeline_options.ocr_options.bitmap_area_threshold = bitmap_area_threshold

with open(sys.argv[4], "a") as file:
    try:
        # Acquire exclusive lock on the file
        fcntl.flock(file.fileno(), fcntl.LOCK_EX)

        _converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=pipeline_options,
                    backend=_get_pdf_backend(pdf_backend_name),
                )
            }
        )
        _converter.initialize_pipeline(InputFormat.PDF)
    finally:
        # Release the lock
        fcntl.flock(file.fileno(), fcntl.LOCK_UN)

buffer = []

def _convert_pdf2parquet(
    doc_filename: str, ext: str, content_bytes: bytes
) -> dict:
    # Convert PDF to Markdown
    start_time = time.time()
    buf = io.BytesIO(content_bytes)
    input_doc = DocumentStream(name=doc_filename, stream=buf)

    conv_res = _converter.convert(input_doc)
    doc = conv_res.document
    elapse_time = time.time() - start_time

    if contents_type == pdf2parquet_contents_types.MARKDOWN:
        content_string = doc.export_to_markdown()
    elif contents_type == pdf2parquet_contents_types.TEXT:
        content_string = doc.export_to_text()
    elif contents_type == pdf2parquet_contents_types.JSON:
        content_string = pd.io.json.ujson_dumps(
            doc.export_to_dict(), double_precision=double_precision
        )
    else:
        raise RuntimeError(f"Uknown contents_type {contents_type}.")
    num_pages = len(doc.pages)
    num_tables = len(doc.tables)
    num_doc_elements = len(doc.texts)
    document_hash = str(doc.origin.binary_hash)  # we turn the uint64 hash into str, because it is easier to handle for pyarrow

    file_data = {
        "filename": os.path.basename(doc_filename),
        "contents": content_string,
        "num_pages": num_pages,
        "num_tables": num_tables,
        "num_doc_elements": num_doc_elements,
        # commented out for tests "document_id": str(uuid.uuid4()),
        "document_hash": document_hash,
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

    global buffer
    data = [*buffer]
    success_doc_id = []
    failed_doc_id = []
    skipped_doc_id = []
    number_of_rows = 0

    try:
        # TODO: Docling has an inner-function with a stronger type checking.
        # Once it is exposed as public, we can use it here as well.
        root_kind = filetype.guess(byte_array)

        # Process single documents
        if root_kind is not None and root_kind.mime in MimeTypeToFormat:
            print(f"Detected root file {file_name=} as {root_kind.mime}.")

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
                logger.warning(
                    f"Exception {str(e)} processing file {file_name}, skipping"
                )

        # Process ZIP archive of documents
        elif root_kind is not None and root_kind.mime == "application/zip":
            print(
                f"Detected root file {file_name=} as ZIP. Iterating through the archive content."
            )

            with zipfile.ZipFile(io.BytesIO(byte_array)) as opened_zip:
                zip_namelist = opened_zip.namelist()

                for archive_doc_filename in zip_namelist:

                    print("Processing " f"{archive_doc_filename=} ")

                    with opened_zip.open(archive_doc_filename) as file:
                        try:
                            # Read the content of the file
                            content_bytes = file.read()

                            # Detect file type
                            kind = filetype.guess(content_bytes)
                            if kind is None or kind.mime not in MimeTypeToFormat:
                                print(
                                    f"File {archive_doc_filename=} is not detected as valid format {kind=}. Skipping."
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
                            logger.warning(
                                f"Exception {str(e)} processing file {archive_doc_filename}, skipping"
                            )

        else:
            logger.warning(
                f"File {file_name=} is not detected as a supported type nor as ZIP but {kind=}. Skipping."
            )


        metadata = {
            "nrows": number_of_rows,
            "nsuccess": len(success_doc_id),
            "nfail": len(failed_doc_id),
            "nskip": len(skipped_doc_id),
        }

        batch_results = []
        buffer = []
        if batch_size <= 0:
            # we do a single batch
            table = pa.Table.from_pylist(data)
            batch_results.append(table)
        else:
            # we create result files containing batch_size rows/documents
            num_left = len(data)
            start_row = 0
            while num_left >= batch_size:
                table = pa.Table.from_pylist(data[start_row:batch_size])
                batch_results.append(table)

                start_row += batch_size
                num_left = num_left - batch_size

            if num_left >= 0:
                buffer = data[start_row:]

        return batch_results, metadata
    except Exception as e:
        logger.error(f"Fatal error with file {file_name=}. No results produced.")
        raise

def flush_binary() -> tuple[list[tuple[bytes, str]], dict[str, Any]]:
    global buffer
    result = []
    if len(buffer) > 0:
        print(f"flushing buffered table with {len(buffer)} rows.")
        table = pa.Table.from_pylist(buffer)
        result.append(table)
        buffer = None
    else:
        print(f"Empty buffer. nothing to flush.")
    return result, {}


byte_array, _ = get_file(sys.argv[1])
out1, metadata = transform_binary(sys.argv[1], byte_array)
out2, metadata2 = flush_binary()
out = out1 + out2
print(f"Done with nrows={metadata['nrows']} nsuccess={metadata['nsuccess']} nfail={metadata['nfail']} nskip={metadata['nskip']}. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])
