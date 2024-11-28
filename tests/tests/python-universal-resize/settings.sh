api=workqueue

expected=("max bytes = 0" "max rows = 125" "got new table with 200 rows" "flushing buffered table with 75 rows of size 82627")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='-e max_rows_per_table=125 <(gunzip -c "$TEST_PATH"/pail/test-data/input/test1.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/input/test2.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/input/test3.parquet.gz)'
