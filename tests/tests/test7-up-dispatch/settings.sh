api=workqueue

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

expected=("Processing 6 task.1.txt" "Processing 6 task.3.txt" "Processing 6 task.5.txt" "Processing 6 task.2.txt" "Processing 6 task.4.txt" "Processing 6 task.6.txt")
NUM_DESIRED_OUTPUTS=6

up_args='<(echo 1) <(echo 2) <(echo 3) <(echo 4) <(echo 5) <(echo 6) <(echo 7) <(echo 8) <(echo 9) <(echo 10)'
