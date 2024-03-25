#!/bin/sh

NS=jaas-user
CONTAINERS="-c main"

while getopts "a:gn:" opt
do
    case $opt in
        a) APP=${OPTARG}; APP_SELECTOR=",app.kubernetes.io/part-of=${APP}"; continue;;
        g) FILTER=""; CONTAINERS="--all-containers"; continue;;
        n) NS=${OPTARG}; continue;;
    esac
done
shift $((OPTIND-1))

SELECTOR=app.kubernetes.io/component=workdispatcher$APP_SELECTOR

if which gum > /dev/null 2>&1
then
    gum spin --title "$(gum log --level info --structured "Waiting for workload to start" app ${APP:-all} namespace ${NS})" -- \
        sh -c "until [[ \$(kubectl get pods -l $SELECTOR -o 'jsonpath={..status.conditions[?(@.type==\"Ready\")].status}' -n $NS --ignore-not-found) = True ]] || [[ \$(kubectl get pods -l $SELECTOR -o 'jsonpath={..status.phase}' -n $NS --ignore-not-found) = Succeeded ]]; do sleep 2; done"
else
    until [[ $(kubectl get pods -l $SELECTOR -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}' -n $NS --ignore-not-found) = True ]] || [[ $(kubectl get pods -l $SELECTOR -o 'jsonpath={..status.phase}' -n $NS --ignore-not-found) = Succeeded ]]
    do echo "Waiting for workload to start: app=${APP} namespace=${NS}" && sleep 2
    done
fi
EC=$?

if [[ $EC = 0 ]]
then
    exec kubectl logs -n $NS -l $SELECTOR --tail=-1 -f $CONTAINERS $@
fi
