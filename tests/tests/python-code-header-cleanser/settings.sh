api=workqueue

expected=("input table has 10 rows" "output table has 10 rows")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/test1.parquet.gz)'
