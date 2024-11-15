api=workqueue
app=https://github.com/IBM/lunchpail-openroad-max-utilization.git
branch=v0.4.0
deployname=lunchpail-openroad-max-utilization

# don't inspect output for validity
NUM_DESIRED_OUTPUTS=0

# we kill the process before it is finished
NO_WAIT_FOR_COMPLETION=1

expected=("Running experiment")

inputapp='$testapp sweep 20 40 1 --interval 1'
