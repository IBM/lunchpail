#!/bin/sh

#
# qcat: cat the contents of a file in the queue.
#
# Usage: qcat [filepath]
#

exec kubectl exec \
     -n jaas-system \
     $(kubectl get pod -l app.kubernetes.io/component=s3 -n jaas-system -o name --no-headers | head -1) \
     -- mc cat s3/$1
