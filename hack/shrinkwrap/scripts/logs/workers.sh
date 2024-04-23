#!/bin/sh

NS=jaas-user
CONTAINERS="-c app"
FILTER="workerpool worker"
APP=the_lunchpail_app
APP_SELECTOR=",app.kubernetes.io/part-of=the_lunchpail_app"

while getopts "a:gn:" opt
do
    case $opt in
        a) APP=${OPTARG}; APP_SELECTOR=",app.kubernetes.io/part-of=${APP}"; continue;;
        g) FILTER=""; CONTAINERS="--all-containers"; continue;;
        n) NS=${OPTARG}; continue;;
    esac
done
shift $((OPTIND-1))

SELECTOR=app.kubernetes.io/component=workerpool$APP_SELECTOR

if which gum > /dev/null 2>&1
then
    gum spin --title "$(gum log --level info --structured "Waiting for workload to start" app ${APP:-all} namespace ${NS})" -- \
        sh -c "while [[ \$(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]; do sleep 2; done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready"
else
    while [[ $(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]
    do echo "Waiting for workload to start: app=${APP} namespace=${NS}" && sleep 2
    done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready
fi
EC=$?

if [[ $EC = 0 ]]
then
    exec kubectl logs -n $NS -l $SELECTOR --tail=-1 -f $CONTAINERS --max-log-requests=99 $@ | grep -v "$FILTER"
fi
