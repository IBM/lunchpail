api=workqueue

expected=("input table has 2 rows and 2 columns" "output table has 2 rows and 14 columns" "input table has 2 rows and 2 columns" "output table has 2 rows and 14 columns")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/sample_1.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/input/sample_2.parquet.gz)'
