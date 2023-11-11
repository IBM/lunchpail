# api=workqueue

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

expected=('Processing /queue/[[:digit:]]+/inbox/task.1.txt' 'Processing /queue/[[:digit:]]+/inbox/task.3.txt' 'Processing /queue/[[:digit:]]+/inbox/task.5.txt' 'Processing /queue/[[:digit:]]+/inbox/task.2.txt' 'Processing /queue/[[:digit:]]+/inbox/task.4.txt' 'Processing /queue/[[:digit:]]+/inbox/task.6.txt')
