#!/usr/bin/env bash

set -e
set -o pipefail

name="$1"
run_id="$2"
subPath="$3"
image="$4"
nprocs="$5"
nprocs_per_node="$6"
gpu="$7"
cpu="$8"
memory="$9"
scheduler_args="${10}"
script="${11}"
volumes="${12}"
command_line_options="$(echo -n ${13} | base64 -d)"
env=$(echo -n ${14} | base64 -d)

scheduler=kubernetes_mcad
component=dist.ddp

resources="${nprocs}x${nprocs_per_node}"

# !!Workaround!! torchx does not handle Mi units
NUMERIC_PART=$(echo $memory | sed -E 's/[MGTP]i?//i')
SCALE_PART=$(echo $memory | sed -E 's/^.+Mi$/1/i' | sed -E 's/^.+Gi$/1024/i' | sed -E 's/^.+Ti$/1024 * 1024/i' | sed -E 's/^.+Pi$/1024 * 1024 * 1024/i')
memMB=$(echo "scale=0; $NUMERIC_PART * $SCALE_PART" | bc -l) # scale=0 gives us an integer value

# Torchx's dry-run output will go to this temporary file
DRY=$(mktemp)
echo "Writing torchx dryrun to $DRY" 1>&2

# Fire off a `kubectl wait` which will return when the job we are
# about to launch is running. Below, we will do a `wait` that
# subprocess. We need to launch this first, before doing the `kubectl
# apply` to avoid a race window.
kubectl wait -l app.kubernetes.io/instance=$run_id --for=condition=Running --timeout=-1s &

# Run torchx in dry-run mode, so that we can hack it a bit.
torchx run --dryrun \
       --workspace='' \
       --scheduler $scheduler \
       --scheduler_args "$scheduler_args" \
       $component \
       --gpu $gpu \
       --cpu $cpu \
       --memMB $memMB \
       --name main \
       --image "$image" \
       --script "$script" \
       --mounts "$volumes" \
       -j "$resources" \
       $env \
       -- $command_line_options \
    | awk '$0=="=== SCHEDULER REQUEST ===" {on=1} on==2 { print $0 } on==1{on=2}' \
    | sed "s/main-pg/pg/" \
    | sed -E "s/main-[a-zA-Z0-9]+/$run_id/g" \
    | sed -E "s#app.kubernetes.io/name: main#app.kubernetes.io/name: ${name}#" \
    | sed -E 's#app.kubernetes.io/managed-by: torchx.pytorch.org#app.kubernetes.io/managed-by: codeflare.dev#' \
    | sed -E 's#(python -m torch.distributed.run|torchrun)#export TERM=xterm-256color; cd $_CODEFLARE_WORKDIR; function log() { local status="$1"; local msg="$2"; echo -e "\\x1b[2;1;32m[Job \\x1b[0;32m${status}\\x1b[1;2;32m] \\x1b[0;2;32mpod/$(hostname) ${msg} \\x1b[0;32m$(date -u +%Y-%m-%dT%T.%3NZ)\\x1b[0m" | tee -a /tmp/status.txt ; } ; function active() { if [[ -z "$code" ]]; then log Running "Job is active"; fi; } ;(for i in `seq 1 10`; do active; sleep 4; done) \& poller=$! ; function catch() { local code=$?; kill $poller ; log Failed "Job failed"; sleep 2; exit $code; } ; function bye() { local code=$?; kill $poller ; if [[ $code = 0 ]]; then log Succeeded "Job completed successfully"; fi; sleep 2; } ; trap catch ERR; trap bye EXIT; \1#' \
    | awk -v subPath=$subPath '{ idx=index($0, "volumeMounts:"); print $0; if (idx > 0) { for (i=1; i<idx; i++) printf " "; print "- name: workdir-volume"; for (i=1; i<idx+2; i++) printf " "; print "subPath:", subPath; for (i=1; i<idx+2; i++) printf " "; print "mountPath: /workdir"; for (i=1; i<idx+2; i++) printf " "; print "readOnly: true"} }' \
    | awk -v workdirServer=$WORKDIR_SERVER '{ idx=index($0, "volumes:"); print $0; if (idx > 0) { for (i=1; i<idx; i++) printf " "; print "- name: workdir-volume"; for (i=1; i<idx+2; i++) printf " "; print "nfs:"; for (i=1; i<idx+4; i++) printf " "; print "server:", workdirServer; for (i=1; i<idx+4; i++) printf " "; print "path: /"} }' \
          > $DRY


# if we ever need to add the subPath to a volume that torchx is managing
  #| awk -v subPath=$subPath '{ print $0; if ($0 ~ /mountPath: \/workdir/) { copy=$0; sub("- ", "  ", copy); sub("mountPath:", "subPath:", copy); sub("/workdir", subPath, copy); print copy; }}' \

# Notes: we could just pipe the torchx dry-run directly to kubectl
# apply, avoiding the temporary $DRY file... but keeping it separate
# for now helps with debugging
kubectl apply -f $DRY
rm $DRY

# Wait for the job to be running. See the `kubectl wait` above. Here,
# we are bash-waiting on that kubectl await!
wait

# Get and emit the head pod name; it will be the "return value" of
# this script. Take care not to emit anything else on stdout in this
# script!
HEAD=$(kubectl get pod -l app.kubernetes.io/instance=$run_id,torchx.pytorch.org/replica-id=0,torchx.pytorch.org/role-index=0 --no-headers -o custom-columns=NAME:.metadata.name)
echo $HEAD
