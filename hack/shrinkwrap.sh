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

echo "$(tput setaf 2)Booting Lunchpail for arch=$ARCH$(tput sgr0)"

for f in "$SCRIPTDIR"/01-jaas-prereqs1.yml "$SCRIPTDIR"/02-jaas.yml "$SCRIPTDIR"/04-jaas-defaults.yml "$SCRIPTDIR"/05-jaas-default-user.yml
do
    if [ -f "${f%%.yml}.namespace" ]; then ns="-n $(cat "${f%%.yml}.namespace")"; else ns=""; fi
    kubectl apply --server-side -f $f $ns

    if [ "$(basename $f)" = "02-jaas.yml" ]
    then
        if which -s gum
        then
            gum spin --title "$(tput setaf 2)Waiting for controllers to be ready$(tput sgr0)" -- \
              kubectl wait pod -l app.kubernetes.io/name=dlf -n jaas-system --for=condition=ready --timeout=-1s && \
                kubectl wait pod -l app.kubernetes.io/part-of=codeflare.dev -n jaas-system --for=condition=ready --timeout=-1s
        else
            echo "$(tput setaf 2)Waiting for controllers to be ready$(tput sgr0)"
            kubectl wait pod -l app.kubernetes.io/name=dlf -n jaas-system --for=condition=ready --timeout=-1s
            kubectl wait pod -l app.kubernetes.io/part-of=codeflare.dev -n jaas-system --for=condition=ready --timeout=-1s
        fi
    fi
done
EOF
chmod +x "$OUTDIR"/up

# Future: wait for nvidia operators, too
#if [[ "$HAS_NVIDIA" = true ]]; then
#    echo "$(tput setaf 2)Waiting for gpu operator to be ready$(tput sgr0)"
#    $KUBECTL wait pod -l app.kubernetes.io/managed-by=gpu-operator -n $NAMESPACE_SYSTEM --for=condition=ready --timeout=-1s
#fi

# down
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" > "$OUTDIR"/down
#!/bin/sh

#
# down: bring down the services
#

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

echo "$(tput setaf 2)Shutting down Lunchpail$(tput sgr0)"

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

NS=jaas-user
TAIL=-1

while getopts "a:n:t:" opt
do
    case $opt in
        a) APP=${OPTARG}; APP_SELECTOR=",app.kubernetes.io/part-of=${APP}"; continue;;
        n) NS=${OPTARG}; continue;;
        t) TAIL=${OPTARG}; continue;;
    esac
done

SELECTOR=app.kubernetes.io/component=workstealer$APP_SELECTOR

if which -s gum
then
    gum spin --title "$(gum log --level info --structured "Waiting for workload to start" app ${APP:-all} namespace ${NS:-jaas-user})" -- \
        sh -c "while [[ \$(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]; do sleep 2; done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready"
else
    while [[ $(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]
    do echo "Waiting for workload to start: app=${APP:-all} namespace=${NS:-jaas-user}" && sleep 2
    done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready
fi
EC=$?

if [[ $EC = 0 ]]
then
    exec kubectl logs -l $SELECTOR -n $NS -f --tail=$TAIL $EXTRA | grep lunchpail.io
else exit $EC
fi
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

exec kubectl exec $(kubectl get pod -l app.kubernetes.io/component=s3 -n jaas-system -o name --no-headers | head -1) -n jaas-system -- mc ls s3/$1
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

exec kubectl exec $(kubectl get pod -l app.kubernetes.io/component=s3 -n jaas-system -o name --no-headers | head -1) -n jaas-system -- mc cat s3/$1
EOF
chmod +x "$OUTDIR"/qcat

# lunchpail controller logs
mkdir -p "$OUTDIR"/logs/controllers
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/logs/controllers/lunchpail
#!/bin/sh
exec kubectl logs -n jaas-system -l app.kubernetes.io/name=run-controller --tail=-1 $@
EOF
chmod +x "$OUTDIR"/logs/controllers/lunchpail

# workerpool logs
mkdir -p "$OUTDIR"/logs
cat <<'EOF' | sed "s#kubectl#$KUBECTL#g" | sed "s#jaas-system#$NAMESPACE_SYSTEM#g" > "$OUTDIR"/logs/workers
#!/bin/sh

NS=jaas-user
CONTAINERS="-c app"
FILTER="workerpool worker"

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

if which -s gum
then
    gum spin --title "$(gum log --level info --structured "Waiting for workload to start" app ${APP:-all} namespace ${NS})" -- \
        sh -c "while [[ \$(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]; do sleep 2; done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready"
else
    while [[ $(kubectl get pods -l $SELECTOR -n $NS --no-headers --ignore-not-found | wc -l | xargs) = 0 ]]
    do echo "Waiting for workload to start: app=${APP} namespace=${NS}" && sleep 2
    done && kubectl wait pods -l $SELECTOR -n $NS --for=condition=ready
fi
EC=$?

exec kubectl logs -n $NS -l $SELECTOR --tail=-1 -f $CONTAINERS $@ | grep -v "$FILTER"
EOF
chmod +x "$OUTDIR"/logs/workers
