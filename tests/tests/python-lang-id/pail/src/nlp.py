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

from typing import Any

import logging
import pyarrow as pa
from lang_models import LangModel


logger = logging.getLogger(__name__)

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

def get_lang_ds_pa(
        table: pa.table,
        nlp: LangModel,
        content_column_name: str,
        output_lang_column_name: str,
        output_score_column_name: str,
    ) -> tuple[pa.table, dict[str, Any]]:
    detected_language = pa.Table.from_pylist(
        list(
            map(
                lambda r: {"lang": r[0], "score": r[1]},
                map(lambda x: nlp.detect_lang(x), table[content_column_name].to_pylist()),
            )
        )
    )
    stats = pa.table([detected_language["lang"]], names=["lang"]).group_by("lang").aggregate([("lang", "count")])
    stats_dict = {}
    for batch in stats.to_batches():
        d = batch.to_pydict()
        for lang, count in zip(d["lang"], d["lang_count"]):
            stats_dict[lang] = count
    result = add_column(table=table, name=output_lang_column_name, content=detected_language["lang"])
    result = add_column(table=result, name=output_score_column_name, content=detected_language["score"])
    return result, stats_dict
