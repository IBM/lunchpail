import pyarrow as pa
import pyarrow.parquet as pq

table = pa.Table.from_pydict(
    {
        "contents": pa.array(
            [
                "My name is Tom chandler. Captain of the ship",
                "I work at Apple and I like to eat apples",
                "My email is tom@chadler.com and dob is 31.05.1987",
            ]
        ),
        "doc_id": pa.array(["doc1", "doc2", "doc3"]),
    }
)

expected_table = table.add_column(
    0,
    "transformed_contents",
    [
        [
            "My name is <PERSON>. Captain of the ship",
            "I work at <ORGANIZATION> and I like to eat apples",
            "My email is <EMAIL_ADDRESS> and dob is <DATE_TIME>",
        ]
    ],
)

detected_pii = [["PERSON"], ["ORGANIZATION"], ["EMAIL_ADDRESS", "DATE_TIME"]]
expected_table = expected_table.add_column(0, "detected_pii", [detected_pii])

pq.write_table(table, "in.parquet")
pq.write_table(expected_table, "out.parquet")
