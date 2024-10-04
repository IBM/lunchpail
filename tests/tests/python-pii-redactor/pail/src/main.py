print("PII Redactor starting up")

import sys
import pyarrow.parquet as pq

from pii_analyzer import PIIAnalyzerEngine
from pii_anonymizer import PIIAnonymizer

score_threshold_key = "score_threshold"
pii_contents_column = "contents"

default_score_threshold_key = 0.6
score_threshold_value = default_score_threshold_key

default_supported_entities = ["PERSON", "EMAIL_ADDRESS", "ORGANIZATION", "DATE_TIME", "CREDIT_CARD", "PHONE_NUMBER"]
supported_entities = default_supported_entities

default_anonymizer_operator = "replace"
redaction_operator = default_anonymizer_operator

doc_transformed_contents_key = "transformed_contents"
doc_contents_key = doc_transformed_contents_key # fixme

analyzer = PIIAnalyzerEngine(
    supported_entities=supported_entities, score_threshold=score_threshold_value
)
anonymizer = PIIAnonymizer(operator=redaction_operator.lower())

def _analyze_pii(text: str):
    return analyzer.analyze_text(text)

def _redact_pii(text: str):
    text = text.strip()
    if text:
        analyze_results, entity_types = _analyze_pii(text)
        anonymized_results = anonymizer.anonymize_text(text, analyze_results)
        return anonymized_results.text, entity_types

try:
    print(f"Reading in parquet file {sys.argv[1]}")
    table = pq.read_table(sys.argv[1])
except Exception as e:
    print(f"Error reading table from {path}: {e}", file=sys.stderr)
    exit(1)
    
metadata = {"original_table_rows": table.num_rows, "original_column_count": len(table.column_names)}
redacted_texts, entity_types_list = zip(*table[pii_contents_column].to_pandas().apply(_redact_pii))

table = table.add_column(0, doc_contents_key, [redacted_texts])
table = table.add_column(0, "detected_pii", [entity_types_list])
metadata["transformed_table_rows"] = table.num_rows
metadata["transformed_column_count"] = len(table.column_names)

print(f"Done. Writing output to {sys.argv[2]}")
pq.write_table(table, sys.argv[2])
