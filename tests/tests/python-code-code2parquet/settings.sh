api=workqueue

expected=("Done with number_of_rows=2" "Done with number_of_rows=20" "Done with number_of_rows=52")
NUM_DESIRED_OUTPUTS=0

# the default is --yaml. we don't want that
source_from=" "

up_args='"$TEST_PATH"/pail/test-data/input/application-java.zip "$TEST_PATH"/pail/test-data/input/data-processing-lib.zip "$TEST_PATH"/pail/test-data/input/https___github.com_00000o1_environments_archive_refs_heads_master.zip'
