#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
part_of="$4"
run_id="$5"
image="$6"
command="$7"
nWorkers="${8}"
cpu="${9}"
memory="${10}"
gpu="${11}"
env="${12}"
volumes="${13}"
volumeMounts="${14}"
envFroms="${15}"
expose="${16}"
securityContext="${17}"
containerSecurityContext="${18}"
component="${19}"
enclosing_run="${20}"
workdir_repo="${21}"
workdir_pat_user="${22}"
workdir_pat_secret="${23}"
workdir_cm_data="${24}"
workdir_cm_mount_path="${25}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

helm install --dry-run --debug $run_id "$SCRIPTDIR"/shell/ -n ${namespace} \
     --set kind=job \
     --set uid=$uid \
     --set name=$name \
     --set partOf=$part_of \
     --set component=$component \
     --set enclosingRun=$enclosing_run \
     --set image=$image \
     --set namespace=$namespace \
     --set command="$command" \
     --set workers.count=$nWorkers \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set volumes=$volumes \
     --set volumeMounts=$volumeMounts \
     --set envFroms=$envFroms \
     --set env="$env" \
     --set expose=$expose \
     --set mcad.enabled=${MCAD_ENABLED:-false } \
     --set rbac.runAsRoot=$RUN_AS_ROOT \
     --set rbac.serviceaccount="$USER_SERVICE_ACCOUNT" \
     --set securityContext=$securityContext \
     --set containerSecurityContext=$containerSecurityContext \
     --set workdir.repo=$workdir_repo \
     --set workdir.pat.user=$workdir_pat_user \
     --set workdir.pat.secret=$workdir_pat_secret \
     --set workdir.cm.data=$workdir_cm_data \
     --set workdir.cm.mount_path=$workdir_cm_mount_path \
     --set lunchpail.image.registry=$IMAGE_REGISTRY \
     --set lunchpail.image.repo=$IMAGE_REPO \
     --set lunchpail.image.version=$IMAGE_VERSION \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

retries=20
while ! kubectl apply -f $DRY
do
    ((--retries)) || exit 1

    echo "Retrying kubectl apply"
    sleep 1
done

rm -f $DRY
