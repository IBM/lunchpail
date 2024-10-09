api=workqueue

expected=("SequenceTagger predicts" "Done. Writing output to")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/xs/1.parquet.gz)'
