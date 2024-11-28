api=workqueue

expected=("SequenceTagger predicts" "Done. Writing output to")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/xs/1.parquet.gz)'
