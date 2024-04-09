#!/bin/sh

exec kubectl logs -n jaas-system -l app.kubernetes.io/name=run-controller --tail=-1 $@
