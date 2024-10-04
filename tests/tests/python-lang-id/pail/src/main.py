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

from os import getenv

import pyarrow as pa
from lang_models import LangModelFactory
from nlp import get_lang_ds_pa

from lang_models import KIND_FASTTEXT

short_name = "lang_id"
cli_prefix = f"{short_name}_"
model_credential_key = "model_credential"
model_kind_key = "model_kind"
model_url_key = "model_url"
content_column_name_key = "content_column_name"
output_lang_column_name_key = "output_lang_column_name"
output_score_column_name_key = "output_score_column_name"
model_credential_cli_param = f"{cli_prefix}{model_credential_key}"
model_kind_cli_param = f"{cli_prefix}{model_kind_key}"
model_url_cli_param = f"{cli_prefix}{model_url_key}"
content_column_name_cli_param = f"{cli_prefix}{content_column_name_key}"
output_lang_column_name_cli_param = f"{cli_prefix}{output_lang_column_name_key}"
output_score_column_name_cli_param = f"{cli_prefix}{output_score_column_name_key}"

default_content_column_name = "text"
default_output_lang_column_name = "lang"
default_output_score_column_name = "score"

model_kind = getenv(model_kind_key, KIND_FASTTEXT)
model_url = getenv(model_url_key, "facebook/fasttext-language-identification")
model_credential = getenv(model_credential_key, "PUT YOUR OWN HUGGINGFACE CREDENTIAL")

def validate_columns(table: pa.Table, required: list[str]) -> None:
    """
    Check if required columns exist in the table
    :param table: table
    :param required: list of required columns
    :return: None
    """
    columns = table.schema.names
    result = True
    for r in required:
        if r not in columns:
            result = False
            break
    if not result:
        raise Exception(
            f"Not all required columns are present in the table - " f"required {required}, present {columns}"
        )

nlp_langid = LangModelFactory.create_model(
    model_kind, model_url, model_credential
)
content_column_name = getenv(content_column_name_key, default_content_column_name)
output_lang_column_name = getenv(output_lang_column_name_key, default_output_lang_column_name)
output_score_column_name = getenv(output_score_column_name_key, default_output_score_column_name)

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table from {path}: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

validate_columns(table, [content_column_name])
if output_lang_column_name in table.schema.names:
    raise Exception(f"column to store identified language ({output_lang_column_name}) already exist")
if output_score_column_name in table.schema.names:
    raise Exception(
        f"column to store score of language identification ({output_score_column_name}) already exist"
    )
print(f"Transforming one table with {len(table)} rows")
table, stats = get_lang_ds_pa(
    table, nlp_langid, content_column_name, output_lang_column_name, output_score_column_name)
print(f"Transformed one table with {len(table)} rows")

print(f"Done. Writing output to {sys.argv[2]}")
pq.write_table(table, sys.argv[2])
