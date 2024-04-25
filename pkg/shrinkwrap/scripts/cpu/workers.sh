#!/bin/sh

#
# Report on CPU utilization for the workers
#
# Hint: try `watch -c cpu/workers`
#

NS=jaas-user
CONTAINERS="-c app"

SELECTOR="app.kubernetes.io/component=workerpool,app.kubernetes.io/instance=the_lunchpail_run"

kubectl get pod -l $SELECTOR -n $NS -oname \
    | xargs -I{} -n1 -P99 \
            kubectl exec {} -c app -n $NS -- \
            bash -c 'f=/sys/fs/cgroup/cpu/cpuacct.usage;tb=$(date +%s%N);cb=$(cat $f);sleep 1;te=$(date +%s%N);ce=$(cat $f);printf "{} %.2f\\n" $(echo "($ce-$cb)/($te-$tb)*100"|bc -l)' \
    | sort -k2 -rn \
    | sed 's#^pod/##g' \
    | while read name pct; do echo -e "$name\t\x1b[1;36m$pct%\x1b[0m"; done
