api=workqueue

expected=("Transforming one table")
NUM_DESIRED_OUTPUTS=1

up_args='<(gzcat "$TEST_PATH"/pail/test-data/sm/input/test_01.parquet.gz) <(gzcat "$TEST_PATH"/pail/test-data/sm/input/test_02.parquet.gz) <(gzcat "$TEST_PATH"/pail/test-data/sm/input/test_03.parquet.gz)'
