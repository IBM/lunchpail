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
part_of="$7"
run_name="$8"
queue_dataset="${9}"
count="${10}"
cpu="${11}"
memory="${12}"
gpu="${13}"
kubecontext="${14}"
kubeconfig="${15}"
env="${16}"
startupDelay="${17}"
volumes="${18}"
volumeMounts="${19}"
envFroms="${20}"
securityContext="${21}"
containerSecurityContext="${22}"
workdir_repo="${23}"
workdir_pat_user="${24}"
workdir_pat_secret="${25}"
workdir_cm_data="${26}"
workdir_cm_mount_path="${27}"

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
