#!/usr/bin/env bash

IFS=',' read -r -a apps <<< "$CODEFLARE_APPS_IN_SEQUENCE"

idx1=$((JOB_COMPLETION_INDEX+1))
runName=${NAME}-step${idx1}
appName="${apps[$JOB_COMPLETION_INDEX]}"

echo "runName=$runName" 1>&2
echo "appName=$appName" 1>&2
echo "namespace=$NAMESPACE" 1>&2
echo "enclosingUid=$ENCLOSING_UID" 1>&2
echo "enclosingRunName=$ENCLOSING_RUN_NAME" 1>&2

#  ownerReferences:
#    - apiVersion: codeflare.dev/v1alpha1
#      controller: true
#      kind: Run
#      name: $ENCLOSING_RUN_NAME
#      uid: $ENCLOSING_UID

logsSince=$(date --rfc-3339=seconds)

cat <<EOF | kubectl apply -n $NAMESPACE -f -
apiVersion: codeflare.dev/v1alpha1
kind: Run
metadata:
  name: $runName
  labels:
    app.kubernetes.io/step: "$idx1"
    app.kubernetes.io/part-of: $ENCLOSING_RUN_NAME
spec:
  application:
    name: $appName
EOF

SELECTOR="app.kubernetes.io/part-of=$ENCLOSING_RUN_NAME,app.kubernetes.io/step=$idx1"

(while true; do echo "Checking logs of $SELECTOR"; kubectl logs --ignore-errors -f -l $SELECTOR -n $NAMESPACE; logsSince=$(date --rfc-3339=seconds); sleep 1; done) &
logs=$!

while true; do
    #    kubectl -n $NAMESPACE wait pod -l app.kubernetes.io/part-of=$runName --for=condition=complete --timeout=-1s && break
    echo "Waiting for $SELECTOR pods to finish $! $code" 1>& 2
    kubectl -n $NAMESPACE wait pod -l $SELECTOR --for=condition=ready=false --timeout=-1s
    code=$?
    if [[ $code = 0 ]]; then break; fi
    sleep 1
done

(kill $logs 2> /dev/null || exit 0)

# capture any remaining logs that may have trickled in
kubectl logs --ignore-errors -l $SELECTOR --since-time=$logsSince -n $NAMESPACE 

if [[ $idx1 == $CODEFLARE_SEQUENCE_LENGTH ]]; then
    echo "Sequence exited with $code" 1>&2
else
    echo "Sequence step $idx1 exited with code $code" 1>&2
fi

exit $code
