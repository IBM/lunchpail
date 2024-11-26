api=workqueue

expected=("Done with nrows=1" "Done with nrows=2")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='"$TEST_PATH"/pail/test-data/input/test1.html "$TEST_PATH"/pail/test-data/input/html_zip.zip'
