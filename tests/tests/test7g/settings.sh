api=workqueue

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

# "tasky" and 3333 come from a values override in the workdispatcher.yaml

expected=('Processing /queue/processing/tasky3333.1.txt 99999999 88888888' 'Processing /queue/processing/tasky3333.3.txt 99999999 88888888' 'Processing /queue/processing/tasky3333.5.txt 99999999 88888888' 'Processing /queue/processing/tasky3333.2.txt 99999999 88888888' 'Processing /queue/processing/tasky3333.4.txt 99999999 88888888' 'Processing /queue/processing/tasky3333.6.txt 99999999 88888888')
