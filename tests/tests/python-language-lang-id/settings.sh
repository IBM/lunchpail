api=workqueue

expected=("Transforming one table" "Done. Writing output to")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/sm/input/test_01.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/sm/input/test_02.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/sm/input/test_03.parquet.gz)'
