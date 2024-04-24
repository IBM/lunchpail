###########################################################################################
#
# Here are the configurable settings:
#
LUNCHPAIL=lunchpail                                         # name of product, used in s3 paths, etc.

IMAGE_REGISTRY=${IMAGE_REGISTRY:-ghcr.io}                   # image registry part of image url
IMAGE_REPO=${IMAGE_REPO:-$LUNCHPAIL}                        # image repo part of image url
CLUSTER_NAME=${CLUSTER_NAME:-jaas}                          # name of kubernetes cluster
CLUSTER_TYPE=${CLUSTER_TYPE:-k8s}                           # k8s|oc -- use oc for OpenShift, which will set sccs for Datashim

CONTEXT_NAME=${CONTEXT_NAME:-kind-${CLUSTER_NAME}}          # i.e. kubectl --context $CONTEXT_NAME, defaults to kind-$CLUSTER_NAME e.g. kind-jaas

NAMESPACE_SUFFIX=""                                          # suffix to add to namespace names
NAMESPACE_USER=${NAMESPACE_USER:-jaas-user$NAMESPACE_SUFFIX} # namespace to use for user resources
NAMESPACE_SYSTEM=${NAMESPACE_SYSTEM:-$NAMESPACE_USER}        # namespace to use for system resources
###########################################################################################
