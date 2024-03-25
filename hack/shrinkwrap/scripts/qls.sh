#!/bin/sh

#
# qls: cat the contents of a file in the queue. With no arguments, it
#      will print the root of the queue. Provided an argument, it will list
#      the contents of that filepath in the queue
#
# Usage: qcat [filepath]
#

exec kubectl exec \
     -n jaas-system \
     $(kubectl get pod -l app.kubernetes.io/component=s3 -n jaas-system -o name --no-headers | head -1) \
     -- mc ls s3/$1
