api=workqueue

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

# xxx should be 3333333333 coming from test7b/pool1.yaml
# yyy should be 2222222222 coming from test7b/app.yaml
values="3333333333 2222222222"
expected=("Processing $values /queue/[[:digit:]]+/processing/task.1.txt" "Processing $values /queue/[[:digit:]]+/processing/task.3.txt" "Processing $values /queue/[[:digit:]]+/processing/task.5.txt" "Processing $values /queue/[[:digit:]]+/processing/task.2.txt" "Processing $values /queue/[[:digit:]]+/processing/task.4.txt" "Processing $values /queue/[[:digit:]]+/processing/task.6.txt")
