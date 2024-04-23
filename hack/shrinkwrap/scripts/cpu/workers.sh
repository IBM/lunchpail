#!/bin/sh

#
# Report on CPU utilization for the workers
#
# Hint: try `watch -c cpu/workers`
#

NS=jaas-user
CONTAINERS="-c app"

SELECTOR="app.kubernetes.io/component=workerpool,app.kubernetes.io/part-of=the_lunchpail_app"

oc get pod -l $SELECTOR -n $NS -oname \
    | xargs -I{} -n1 -P99 \
            oc exec {} -c app -n $NS -- \
            bash -c 'tstart=$(date +%s%N); cstart=$(cat /sys/fs/cgroup/cpu/cpuacct.usage); sleep 1; tstop=$(date +%s%N); cstop=$(cat /sys/fs/cgroup/cpu/cpuacct.usage); printf "{} %.2f\\n" $(echo "($cstop - $cstart) / ($tstop - $tstart) * 100" | bc -l)' \
    | sort -k2 -rn \
    | sed 's#^pod/##g' \
    | while read name pct; do echo -e "$name\t\x1b[1;36m$pct%\x1b[0m"; done
