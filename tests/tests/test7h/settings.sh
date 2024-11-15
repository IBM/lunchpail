api=workqueue

expected=(0 10 test7hdata yes)
handler=waitForUnassignedAndOutbox

NUM_DESIRED_OUTPUTS=11
inputapp='$testapp sweep 1 10 1 --interval 1 -e taskprefix=tasky -e taskprefix2=3333'

