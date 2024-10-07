api=workqueue

expected=("Load badwords found locally" "Done. Writing output to")
NUM_DESIRED_OUTPUTS=0

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/input/test1.parquet.gz)'
