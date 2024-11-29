api=workqueue

expected=("input table has 2 rows and 2 columns" "output table has 2 rows and 14 columns" "input table has 2 rows and 2 columns" "output table has 2 rows and 14 columns")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='--gunzip "$TEST_PATH"/pail/test-data/input/sample_1.parquet.gz "$TEST_PATH"/pail/test-data/input/sample_2.parquet.gz'
