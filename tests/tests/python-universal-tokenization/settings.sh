api=workqueue

expected=("Done with num_files=1 num_rows=3 num_tokenized_rows=3 num_empty_rows=0 num_tokens=45 num_chars=193" "Done with num_files=1 num_rows=2 num_tokenized_rows=2 num_empty_rows=0 num_tokens=28 num_chars=132")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='<(gunzip -c "$TEST_PATH"/pail/test-data/ds01/input/lang=en/pq01.parquet.gz) <(gunzip -c "$TEST_PATH"/pail/test-data/ds01/input/lang=en/pq02.parquet.gz)'
