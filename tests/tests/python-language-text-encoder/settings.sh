api=workqueue

expected=("Done with nfiles=1 nrows=2")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='--gunzip "$TEST_PATH"/pail/test-data/input/test1.parquet.gz'
