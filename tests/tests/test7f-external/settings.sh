api=workqueue
app=git@github.ibm.com:cloud-computer/lunchpail-demo.git
branch=v0.0.12
deployname=lunchpail-demo

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

# "tasky" and 3333 come from a values override in the workdispatcher.yaml

expected=('Processing /queue/[[:digit:]]+/processing/tasky3333.1.txt' 'Processing /queue/[[:digit:]]+/processing/tasky3333.3.txt' 'Processing /queue/[[:digit:]]+/processing/tasky3333.5.txt' 'Processing /queue/[[:digit:]]+/processing/tasky3333.2.txt' 'Processing /queue/[[:digit:]]+/processing/tasky3333.4.txt' 'Processing /queue/[[:digit:]]+/processing/tasky3333.6.txt')
