import type ComputeTargetEvent from "@jaas/common/events/ComputeTargetEvent"

/** What kind of cluster is this? */
export default function getComputeTargetType(clusterName: string): ComputeTargetEvent["spec"]["type"] {
  return /^kind-/.test(clusterName) ? "Kind" : /openshift/.test(clusterName) ? "OpenShift" : "Kubernetes"
}
