api=workqueue

expected=("input table has 5 rows and 38 columns" "output table has 3 rows and 39 columns" "output table has 3 rows and 39 columns")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/sample1.parquet.gz)'
