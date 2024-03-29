api=workqueue
taskqueue=test7

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

expected=("Processing /queue/[[:digit:]]+/processing/task.1.txt" "Processing /queue/[[:digit:]]+/processing/task.3.txt" "Processing /queue/[[:digit:]]+/processing/task.5.txt" "Processing /queue/[[:digit:]]+/processing/task.2.txt" "Processing /queue/[[:digit:]]+/processing/task.4.txt" "Processing /queue/[[:digit:]]+/processing/task.6.txt")
