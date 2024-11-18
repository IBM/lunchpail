api=workqueue

expected=("Done with nrows=1 nsuccess=1 nfail=0 nskip=0" "Done with nrows=2 nsuccess=2 nfail=0 nskip=0")
NUM_DESIRED_OUTPUTS=0

# --pack=1 because FileNotFoundError: [Errno 2] No such file or directory: '/home/runner/.EasyOCR//model/temp.zip'
up_args='"$TEST_PATH"/pail/test-data/input/redp5110-ch1.pdf "$TEST_PATH"/pail/test-data/input/archive1.zip'
