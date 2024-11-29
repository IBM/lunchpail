api=workqueue

expected=("input table has 5 rows and 38 columns" "output table has 3 rows and 39 columns" "output table has 3 rows and 39 columns")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='--gunzip "$TEST_PATH"/pail/test-data/input/sample1.parquet.gz'
