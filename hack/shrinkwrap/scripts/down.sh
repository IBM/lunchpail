#!/usr/bin/env bash

#
# down: bring down the services
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

echo "$(tput setaf 2)Shutting down Lunchpail app=the_lunchpail_app$(tput sgr0)"

for f in "$SCRIPTDIR"/the_lunchpail_app.yml "$SCRIPTDIR"/00-core.yml
do
    if [ ! -f "$f" ]
    then continue
    fi

    if [ -f "${f%%.yml}.namespace" ]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    kubectl delete --ignore-not-found -f $f $ns 3>&1 1>&2 2>&3 3>&- | grep -Ev '(resource mapping not found|ensure CRDs)'

    if [ "$(basename $f)" = "the_lunchpail_app.yml" ]
    then
        if kubectl get crd datasetsinternal.com.ie.ibm.hpsys >& /dev/null
        then
            kubectl get --ignore-not-found $ns datasetinternal.com.ie.ibm.hpsys -o name | \
                xargs -I{} -n1 kubectl wait --timeout=-1s $ns {} --for=delete
        fi
    fi
done
