api=workqueue

expected=("SequenceTagger predicts")
NUM_DESIRED_OUTPUTS=1

up_args='<(gzcat "$TEST_PATH"/pail/test-data/xs/1.parquet.gz)'
