#!/bin/sh

echo "DEBUG prestop starting"

echo "DEBUG prestop touching donefile"
lunchpail qdone
echo "DEBUG prestop touching donefile: done"

echo "INFO Done with my part of the job"
