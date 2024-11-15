api=workqueue

# see preinit.sh for "rcloneremotetest"
taskqueue=rclone://rcloneremotetest/test7f

# /queue/0,1 <-- 2 workers
# task.1,task.3,task.5 <-- 3 tasks per iter

# "tasky" and 3333 come from a values override in the workdispatcher.yaml

# 11 for now, till we fix the issue with multi-output support: the sweep adds one extra for now
expected=(0 11 defaultjaasqueue)
handler=waitForUnassignedAndOutbox

inputapp='$testapp sweep 1 10 1 --interval 1 -e taskprefix=tasky -e taskprefix2=3333'
