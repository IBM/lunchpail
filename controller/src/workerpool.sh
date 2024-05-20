#!/usr/bin/env bash

set -x
set -e
set -o pipefail

SCRIPTDIR=$(cd $(dirname "$0") && pwd)

uid="$1"
name="$2"
namespace="$3"
run_id="$4"
image="$5"
command="$6"
subPath="$7"
part_of="$8"
run_name="$9"
queue_dataset="${10}"
count="${11}"
cpu="${12}"
memory="${13}"
gpu="${14}"
kubecontext="${15}"
kubeconfig="${16}"
env="${17}"
startupDelay="${18}"
volumes="${19}"
volumeMounts="${20}"
envFroms="${21}"
securityContext="${22}"
containerSecurityContext="${23}"
workdir_repo="${24}"
workdir_pat_user="${25}"
workdir_pat_secret="${26}"
workdir_cm_data="${27}"
workdir_cm_mount_path="${28}"

# Helm's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Dry running to $DRY" 1>&2

if [[ -n "$kubecontext" ]]
then
    kubecontext_option="--context $kubecontext"
    helm_kubecontext_option="--kube-context $kubecontext"
fi

if [[ -n "$kubeconfig" ]]
then
    kubeconfig_path=$(mktemp)
    echo -n "$kubeconfig" | base64 -d | sed "s/127\.0\.0\.1/${DOCKER_HOST:-host.docker.internal}/g" | sed "s/0\.0\.0\.0/${DOCKER_HOST:-host.docker.internal}/g" > ${kubeconfig_path}
    kubeconfig_option="--kubeconfig ${kubeconfig_path} --insecure-skip-tls-verify"
    helm_kubeconfig_option="--kubeconfig ${kubeconfig_path} --kube-insecure-skip-tls-verify"
fi

helm install --dry-run --debug $run_id "$SCRIPTDIR"/workerpool/ -n ${namespace} ${helm_kubecontext_option} ${helm_kubeconfig_option} \
     --set uid=$uid \
     --set name=$name \
     --set image.app=$image \
     --set image.registry=$IMAGE_REGISTRY \
     --set image.repo=$IMAGE_REPO \
     --set image.version=$IMAGE_VERSION \
     --set namespace=$namespace \
     --set command="$command" \
     --set subPath=$subPath \
     --set partOf=$part_of \
     --set runName=$run_name \
     --set workers.count=$count \
     --set workers.cpu=$cpu \
     --set workers.memory=$memory \
     --set workers.gpu=$gpu \
     --set lunchpail=$LUNCHPAIL \
     --set queue.dataset=$queue_dataset \
     --set volumes=$volumes \
     --set volumeMounts=$volumeMounts \
     --set envFroms=$envFroms \
     --set env="$env" \
     --set startupDelay=$startupDelay \
     --set mcad.enabled=${MCAD_ENABLED:-false} \
     --set rbac.runAsRoot=$RUN_AS_ROOT \
     --set rbac.serviceaccount="$USER_SERVICE_ACCOUNT" \
     --set securityContext=$securityContext \
     --set containerSecurityContext=$containerSecurityContext \
     --set workdir.repo=$workdir_repo \
     --set workdir.pat.user=$workdir_pat_user \
     --set workdir.pat.secret=$workdir_pat_secret \
     --set workdir.cm.data=$workdir_cm_data \
     --set workdir.cm.mount_path=$workdir_cm_mount_path \
    | awk '$0~"Source: " {on=1} on==2 { print $0 } on==1{on=2}' \
          > $DRY

# we could pipe the helm install to kubectl apply; leaving them
# separate now to aid with debugging
retries=20
while ! kubectl apply -f $DRY ${kubecontext_option} ${kubeconfig_option}
do
    ((--retries)) || exit 1

    echo "Retrying kubectl apply"
    sleep 1
done

rm -f $DRY

if [[ -f "$kubeconfig_path" ]]
then rm -f "$kubeconfig_path"
fi
