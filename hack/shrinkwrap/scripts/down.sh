#!/bin/sh

#
# down: bring down the services
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

echo "$(tput setaf 2)Shutting down Lunchpail app=the_lunchpail_app$(tput sgr0)"

for f in "$SCRIPTDIR"/05-jaas-default-user.yml "$SCRIPTDIR"/04-jaas-defaults.yml "$SCRIPTDIR"/02-jaas.yml "$SCRIPTDIR"/01-jaas-prereqs1.yml
do
    if [ ! -f "$f" ]
    then continue
    fi

    if [ -f "${f%%.yml}.namespace" ]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    kubectl delete --ignore-not-found -f $f $ns
done
