api=workqueue

expected=("Transforming one table" "Done. Writing output to")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='--gunzip "$TEST_PATH"/pail/test-data/sm/input/test_01.parquet.gz "$TEST_PATH"/pail/test-data/sm/input/test_02.parquet.gz "$TEST_PATH"/pail/test-data/sm/input/test_03.parquet.gz'
