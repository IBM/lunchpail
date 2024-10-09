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

import os
from typing import Any

import pyarrow as pa
from doc_c4_statistics import (
    c4_contain_pattern_ratio,
    c4_contains_ldnoobw_words,
    c4_load_ldnoobw_words,
    c4_sentence_count,
)
from doc_Gopher_statistics import (
    compute_average_japanese_sentence_length,
    compute_bullet_point_ellipsis_alphabet_word_ratio,
    compute_word_statistics,
    contains_common_English_words,
    find_first_japanese_alphabet_position,
)


short_name = "docq"
cli_prefix = f"{short_name}_"
text_lang_key = "text_lang"
doc_content_column_key = "doc_content_column"
bad_word_filepath_key = "bad_word_filepath"
text_lang_cli_param = f"{cli_prefix}{text_lang_key}"
doc_content_column_cli_param = f"{cli_prefix}{doc_content_column_key}"
bad_word_filepath_cli_param = f"{cli_prefix}{bad_word_filepath_key}"

default_text_lang = "en"
default_doc_content_column = "contents"

data_factory_internal_key = f"{cli_prefix}data_factory"
files_to_use_internal_key = f"{cli_prefix}files_to_use"

#    Initialize based on the dictionary of configuration information.
#    This is generally called with configuration parsed from the CLI arguments defined
#    by the companion runtime, DocQualityTransformRuntime.
text_lang = getenv(text_lang_key, default_text_lang)
doc_content_column = getenv(doc_content_column_key, default_doc_content_column)

bad_word_filepath = getenv(bad_word_filepath_key, os.path.join("data/ldnoobw", text_lang))
if bad_word_filepath is not None:
    if os.path.exists(bad_word_filepath):
        print(f"Load badwords found locally from {bad_word_filepath}", file=sys.stderr)
        re_pattern = c4_load_ldnoobw_words(ft_lang=text_lang, file_path=bad_word_filepath)
    else:
        raise RuntimeError(
            f"Did not find DataAccessFactory instance under {data_factory_internal_key} key. This is required when bad word file is not in the local file system."
        )


def add_column(table: pa.Table, name: str, content: list[Any]) -> pa.Table:
    """
    Add column to the table
    :param table: original table
    :param name: column name
    :param content: content of the column
    :return: updated table, containing new column
    """
    # check if column already exist and drop it
    if name in table.schema.names:
        table = table.drop(columns=[name])
    # append column
    return table.append_column(field_=name, column=[content])
    
def transform(table: pa.Table, file_name: str = None) -> tuple[list[pa.Table], dict[str, Any]]:
    """
    Put Transform-specific to convert one Table to 0 or more tables. It also returns
    a dictionary of execution statistics - arbitrary dictionary
    """
    docq_total_words = []
    docq_mean_word_len = []
    docq_symbol_to_word_ratio = []
    docq_sentence_count = []
    docq_curly_bracket_ratio = []
    docq_lorem_ipsum_ratio = []
    docq_contain_bad_word = []
    docq_bullet_point_ratio = []
    docq_ellipsis_line_ratio = []
    docq_alphabet_word_ratio = []
    docq_contain_common_en_words = []
    if text_lang == "ja":
        # for japanese language, add 2 extra columns for 2 heuristic rules:
        docq_avg_ja_sentence_len = []
        docq_first_ja_alphabet_pos = []

    for text in table[doc_content_column].to_pylist():
        total_words, mean_word_len, symbol_to_word_ratio = compute_word_statistics(text)
        docq_total_words.append(total_words)
        docq_mean_word_len.append(mean_word_len)
        docq_symbol_to_word_ratio.append(symbol_to_word_ratio)

        docq_sentence_count.append(c4_sentence_count(text, ft_lang=text_lang))

        docq_lorem_ipsum_ratio.append(
            c4_contain_pattern_ratio(text, pattern="lorem ipsum", ft_lang=text_lang, normalize_text=True)
        )
        curly_bracket_ratio = 0.0
        for sign in ["{", "}"]:
            curly_bracket_ratio += c4_contain_pattern_ratio(
                text, pattern=sign, ft_lang=text_lang, normalize_text=False
            )
        docq_curly_bracket_ratio.append(curly_bracket_ratio)
        docq_contain_bad_word.append(c4_contains_ldnoobw_words(text, re_pattern))

        (
            bullet_point_ratio,
            ellipsis_line_ratio,
            alphabet_word_ratio,
        ) = compute_bullet_point_ellipsis_alphabet_word_ratio(text)
        docq_bullet_point_ratio.append(bullet_point_ratio)
        docq_ellipsis_line_ratio.append(ellipsis_line_ratio)
        docq_alphabet_word_ratio.append(alphabet_word_ratio)

        docq_contain_common_en_words.append(contains_common_English_words(text, text_lang))

        if text_lang == "ja":
            docq_avg_ja_sentence_len.append(compute_average_japanese_sentence_length(text))
            docq_first_ja_alphabet_pos.append(find_first_japanese_alphabet_position(text))

    table = add_column(table=table, name="docq_total_words", content=docq_total_words)
    table = add_column(table=table, name="docq_mean_word_len", content=docq_mean_word_len)
    table = add_column(
        table=table, name="docq_symbol_to_word_ratio", content=docq_symbol_to_word_ratio
    )
    table = add_column(table=table, name="docq_sentence_count", content=docq_sentence_count)
    table = add_column(table=table, name="docq_lorem_ipsum_ratio", content=docq_lorem_ipsum_ratio)
    table = add_column(
        table=table, name="docq_curly_bracket_ratio", content=docq_curly_bracket_ratio
    )
    table = add_column(table=table, name="docq_contain_bad_word", content=docq_contain_bad_word)
    table = add_column(table=table, name="docq_bullet_point_ratio", content=docq_bullet_point_ratio)
    table = add_column(
        table=table, name="docq_ellipsis_line_ratio", content=docq_ellipsis_line_ratio
    )
    table = add_column(
        table=table, name="docq_alphabet_word_ratio", content=docq_alphabet_word_ratio
    )
    table = add_column(
        table=table, name="docq_contain_common_en_words", content=docq_contain_common_en_words
    )

    if text_lang == "ja":
        table = table.append_column("docq_avg_ja_sentence_len", pa.array(docq_avg_ja_sentence_len))
        table = table.append_column("docq_first_ja_alphabet_pos", pa.array(docq_first_ja_alphabet_pos))

    metadata = {
        "total_docs_count": table.num_rows,
    }

    return [table], metadata

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table: {e}", file=sys.stderr)
    exit(1)
print(f"Done Reading in parquet file {sys.argv[1]}")

out, metadata = transform(table)
print(f"Done. Writing output to {sys.argv[2]}")
pq.write_table(out[0], sys.argv[2])

