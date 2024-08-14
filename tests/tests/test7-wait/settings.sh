api=workqueue
taskqueue=test7-wait

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

expected=("Processing 6 task.1.txt" "Task completed task.1.txt" "Task completed task.3.txt")
