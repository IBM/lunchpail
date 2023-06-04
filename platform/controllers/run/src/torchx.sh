#!/usr/bin/env bash

set -x

name="$1"
subPath="$2"
image="$3"
scheduler_args="$4"
script="$5"
resources="$6"
volumes="$7"
command_line_options="$(echo -n $8 | base64 -d)"
env=$(echo -n $9 | base64 -d)

scheduler=kubernetes_mcad
component=dist.ddp

DRY=$(mktemp)
echo "Writing torchx dryrun to $DRY"

torchx run --dryrun \
       --workspace='' \
       --scheduler $scheduler \
       --scheduler_args "$scheduler_args" \
       $component \
       --name "$name" \
       --image "$image" \
       --script "$script" \
       --mounts "$volumes" \
       -j "$resources" \
       $env \
       -- $command_line_options \
    | awk '$0=="=== SCHEDULER REQUEST ===" {on=1} on==2 { print $0 } on==1{on=2}' \
    | sed -E 's#(python -m torch.distributed.run|torchrun)#export TERM=xterm-256color; cd $_CODEFLARE_WORKDIR; function log() { local status="$1"; local msg="$2"; echo -e "\\x1b[2;1;32m[Job \\x1b[0;32m${status}\\x1b[1;2;32m] \\x1b[0;2;32mpod/$(hostname) ${msg} \\x1b[0;32m$(date -u +%Y-%m-%dT%T.%3NZ)\\x1b[0m" | tee -a /tmp/status.txt ; } ; function active() { if [[ -z "$code" ]]; then log Running "Job is active"; fi; } ;(for i in `seq 1 10`; do active; sleep 4; done) \& poller=$! ; function catch() { local code=$?; kill $poller ; log Failed "Job failed"; sleep 2; exit $code; } ; function bye() { local code=$?; kill $poller ; if [[ $code = 0 ]]; then log Succeeded "Job completed successfully"; fi; sleep 2; } ; trap catch ERR; trap bye EXIT; \1#' \
    | awk -v subPath=$subPath '{ print $0; if ($0 ~ /mountPath: \/workdir/) { copy=$0; sub("- ", "  ", copy); sub("mountPath:", "subPath:", copy); sub("/workdir", subPath, copy); print copy; }}' \
          > $DRY

cat $DRY 2>1

set -e
kubectl apply -f $DRY
# rm $DRY
