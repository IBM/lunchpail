#!/bin/sh

#
# qstat: stream statistics on queue depth and live workers
#

NS=jaas-user
TAIL=-1
GREP_OPTIONS="--line-buffered"
SED_OPTIONS="-u"

while getopts "a:n:t:u" opt
do
    case $opt in
        a) APP=${OPTARG}; APP_SELECTOR=",app.kubernetes.io/part-of=${APP}"; continue;;
        n) NS=${OPTARG}; continue;;
        t) TAIL=${OPTARG}; continue;;
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
    exec kubectl logs -l $SELECTOR -n $NS -f --tail=$TAIL $EXTRA | grep $GREP_OPTIONS lunchpail.io \
        | grep $GREP_OPTIONS lunchpail.io \
        | sed -E $SED_OPTIONS 's/^lunchpail.io\t//' \
        | sed -E $SED_OPTIONS 's/^(unassigned|assigned)(\t)([[:digit:]]+\t)/\1\2\x1b[1;7;33m\3\x1b[0m/g' \
        | sed -E $SED_OPTIONS 's/^(processing\t+)([[:digit:]]+\t)/\1\x1b[1;7;34m\2\x1b[0m/g' \
        | sed -E $SED_OPTIONS 's/^(done\t+)([[:digit:]]+\t)([[:digit:]]+\t)/\1\x1b[1;7;32m\2\x1b[0;1;7;31m\3\x1b[0m/g' \
        | sed -E $SED_OPTIONS 's/^(liveworker\t+)([[:digit:]]+\t)([[:digit:]]+\t)([[:digit:]]+\t)([[:digit:]]+\t)/\1\x1b[1;7;33m\2\x1b[0;1;7;34m\3\x1b[0;1;7;32m\4\x1b[10;;7;31m\5\x1b[0m/g' \
        | sed $SED_OPTIONS "s/${APP:-xxxxxxxxxxxxxxxxx}\t//g"
else exit $EC
fi
