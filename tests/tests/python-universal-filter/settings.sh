api=workqueue

expected=("Done with docs_after_filter=100 columns_after_filter=25 bytes_after_filter=478602")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/test1.parquet.gz)'
