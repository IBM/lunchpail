api=workqueue

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

expected=("Processing task.1.txt" "Processing task.3.txt" "Processing task.5.txt" "Processing task.2.txt" "Processing task.4.txt" "Processing task.6.txt")
NUM_DESIRED_OUTPUTS=6

# the default is --yaml. we don't want that
source_from=" "

inputapp='$testapp sweep 1 10 1 --interval 1'
