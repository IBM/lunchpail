#!/bin/sh

#
# qstat: stream statistics on queue depth and live workers
#

NS=jaas-user
TAIL=-1

while getopts "a:n:t:u" opt
do
    case $opt in
        a) APP=${OPTARG}; APP_SELECTOR=",app.kubernetes.io/part-of=${APP}"; continue;;
        n) NS=${OPTARG}; continue;;
        t) TAIL=${OPTARG}; continue;;
        u) GREP_OPTIONS="--line-buffered"; continue;;
    esac
done

SELECTOR=app.kubernetes.io/component=workstealer$APP_SELECTOR

if which gum > /dev/null 2>&1
then
    gum spin --title "$(gum log --level info --structured "Waiting for workload to start" app ${APP:-all} namespace ${NS:-jaas-user})" -- \
        sh -c "while [[ \$(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]; do sleep 2; done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready"

    # clear the gum waiting... line
    tput cuu 1
    tput ed
else
    while [[ $(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]
    do echo "Waiting for workload to start: app=${APP:-all} namespace=${NS:-jaas-user}" && sleep 2
    done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready
fi
EC=$?

if [[ $EC = 0 ]]
then
    exec kubectl logs -l $SELECTOR -n $NS -f --tail=$TAIL $EXTRA | grep $GREP_OPTIONS lunchpail.io
else exit $EC
fi
