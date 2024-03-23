#!/usr/bin/env bash

#
# Generate a self-contained installable yaml
#
# Usage:
#   shrinkwrap.sh -d resources/
#
# This will emit four spearate files (prereqs, core, defaults,
# default-user) in the given directory. By optionally passing `-a
# '--set key1=val1 --set key2=val2'`, you may inject Helm install
# values into the srinkwrap.
#

set -e
set -o pipefail

JAAS_FULL=${JAAS_FULL:-false}

while getopts "ac:d:fl" opt
do
    case $opt in
        d) OUTDIR=${OPTARG}; continue;;
        f) JAAS_FULL=true; continue;;
        a) EXTRA_HELM_INSTALL_FLAGS="${OPTARG}"; continue;;
        l) LITE=1; continue;;
    esac
done
OPTIND=1

if [[ -n "$OUTDIR" ]]
then
    echo "Multi-file output to $OUTDIR"
    PREREQS1="$OUTDIR"/01-jaas-prereqs1.yml
    CORE="$OUTDIR"/02-jaas.yml
    DEFAULTS="$OUTDIR"/04-jaas-defaults.yml
    DEFAULT_USER="$OUTDIR"/05-jaas-default-user.yml

    if [[ ! -e "$OUTDIR" ]]
    then mkdir -p "$OUTDIR"
    else rm -f "$OUTDIR"/*.{yml,namespace}
    fi
else
    echo "Usage: shrinkwrap.sh -d <outdir>" 1>&2
    exit 1
fi

SCRIPTDIR=$(cd $(dirname "$0") && pwd)
TOP="$SCRIPTDIR"/..

if [[ -z "$HELM_DEPENDENCY_DONE" ]]
then
   . "$TOP"/hack/settings.sh
   . "$TOP"/hack/secrets.sh
fi

HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS $EXTRA_HELM_INSTALL_FLAGS"

if [[ -n "$LITE" ]]
then HELM_INSTALL_FLAGS="$HELM_INSTALL_FLAGS $HELM_INSTALL_LITE_FLAGS"
fi

(cd "$TOP"/platform && ./prerender.sh)

if [[ -z "$HELM_DEPENDENCY_DONE" ]]
then
  (cd "$TOP"/platform && helm dependency update . \
       2> >(grep -v 'found symbolic link' >&2) \
       2> >(grep -v 'Contents of linked' >&2))
fi

# Note re: the 2> stderr filters below. scheduler-plugins as of 0.27.8
# has symbolic links :( and helm warns us about these

echo "Final shrinkwrap HELM_INSTALL_FLAGS=$HELM_INSTALL_FLAGS"

# prereqs that the core depends on
$HELM_TEMPLATE \
     --include-crds \
     $NAMESPACE_SYSTEM \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS \
     $HELM_INSTALL_FLAGS \
     --set global.jaas.namespace.create=true \
     --set tags.full=false \
     --set tags.core=false \
     --set tags.prereqs1=true \
     --set tags.defaults=false \
     --set tags.default-user=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$PREREQS1"

# core deployment
$HELM_TEMPLATE \
     --include-crds \
     $NAMESPACE_SYSTEM \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS \
     $HELM_IMAGE_PULL_SECRETS \
     $HELM_INSTALL_FLAGS \
     --set tags.full=$JAAS_FULL \
     --set tags.core=true \
     --set tags.prereqs1=false \
     --set tags.defaults=false \
     --set tags.default-user=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$CORE"

# the kuberay-operator chart has some problems with namespaces; ensure
# that we force everything in core into $NAMESPACE_SYSTEM
echo "$NAMESPACE_SYSTEM" > "${CORE%%.yml}.namespace"

# defaults
$HELM_TEMPLATE \
     jaas-defaults \
     -n $NAMESPACE_SYSTEM \
     "$TOP"/platform \
     $HELM_INSTALL_FLAGS \
     --set tags.full=false \
     --set tags.core=false \
     --set tags.prereqs1=false \
     --set tags.defaults=true \
     --set tags.default-user=false \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$DEFAULTS" 

# default-user
$HELM_TEMPLATE \
     jaas-default-user \
     "$TOP"/platform \
     $HELM_DEMO_SECRETS $HELM_INSTALL_FLAGS \
     $HELM_IMAGE_PULL_SECRETS \
     --set tags.full=false \
     --set tags.core=false \
     --set tags.prereqs1=false \
     --set tags.defaults=false \
     --set tags.default-user=true \
     2> >(grep -v 'found symbolic link' >&2) \
     2> >(grep -v 'Contents of linked' >&2) \
     > "$DEFAULT_USER"

# up
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/up
#!/bin/sh

#
# up: bring up the services
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

for f in "$SCRIPTDIR"/01-jaas-prereqs1.yml "$SCRIPTDIR"/02-jaas.yml "$SCRIPTDIR"/04-jaas-defaults.yml "$SCRIPTDIR"/05-jaas-default-user.yml
do
    if [ -f "${f%%.yml}.namespace" ]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    kubectl apply --server-side -f $f $ns

    if [ "$(basename $f)" = "02-jaas.yml" ]
    then
        echo "$(tput setaf 2)Waiting for controllers to be ready$(tput sgr0)"
        kubectl wait pod -l app.kubernetes.io/name=dlf -n jaas-system --for=condition=ready --timeout=-1s
        kubectl wait pod -l app.kubernetes.io/part-of=codeflare.dev -n jaas-system --for=condition=ready --timeout=-1s
    fi
done
EOF
chmod +x "$OUTDIR"/up

# down
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" > "$OUTDIR"/down
#!/bin/sh

#
# down: bring down the services
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

for f in "$SCRIPTDIR"/05-jaas-default-user.yml "$SCRIPTDIR"/04-jaas-defaults.yml "$SCRIPTDIR"/02-jaas.yml "$SCRIPTDIR"/01-jaas-prereqs1.yml
do
    if [ -f "${f%%.yml}.namespace" ]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    kubectl delete -f $f $ns
done
EOF
chmod +x "$OUTDIR"/down

# qstat
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-user#$NAMESPACE_USER#g" > "$OUTDIR"/qstat
#!/bin/sh

#
# qstat: stream statistics on queue depth and live workers
#

kubectl logs -l app.kubernetes.io/component=workstealer -n jaas-user -f --tail=-1 | grep jaas.dev
EOF
chmod +x "$OUTDIR"/qstat

# qls
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/qls
#!/bin/sh

#
# qls: cat the contents of a file in the queue. With no arguments, it
#      will print the root of the queue. Provided an argument, it will list
#      the contents of that filepath in the queue
#
# Usage: qcat [filepath]
#

kubectl exec $(kubectl get pod -l app.kubernetes.io/component=s3 -n jaas-system -o name --no-headers | head -1) -n jaas-system -- mc ls s3/$1
EOF
chmod +x "$OUTDIR"/qls

# qcat
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/qcat
#!/bin/sh

#
# qcat: cat the contents of a file in the queue.
#
# Usage: qcat [filepath]
#

kubectl exec $(kubectl get pod -l app.kubernetes.io/component=s3 -n jaas-system -o name --no-headers | head -1) -n jaas-system -- mc cat s3/$1
EOF
chmod +x "$OUTDIR"/qcat
