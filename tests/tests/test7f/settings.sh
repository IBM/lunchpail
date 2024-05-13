api=workqueue

# see init.sh for "rcloneremotetest"
taskqueue=rclone://rcloneremotetest/test7f

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

# "tasky" and 3333 come from a values override in the workdispatcher.yaml

expected=(0 10 defaultjaasqueue)
handler=waitForUnassignedAndOutbox
