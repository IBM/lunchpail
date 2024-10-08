api=workqueue

expected=("flushing buffered table with 200 rows of size 93664" "flushing buffered table with 200 rows of size 93664" "flushing buffered table with 200 rows of size 93664")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/test1.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/input/test2.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/input/test3.parquet.gz)'
