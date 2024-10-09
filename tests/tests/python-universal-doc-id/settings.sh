api=workqueue

expected=("input table has 5 rows" "output table has 5 rows")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/sample1.parquet.gz)'
