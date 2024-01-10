import { JobManagerStatus } from "@jay/renderer/Status"

export function isHealthy(status: null | JobManagerStatus) {
  return status?.kubernetesCluster && status?.jaasRuntime
}
