import { doesClusterExist } from "./management"
import { isRuntimeProvisioned } from "./runtime"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export async function getStatusFromMain(): Promise<import("@jay/common/status/JobManagerStatus").default> {
  const [location, cluster, runtime, examples, defaults] = await Promise.all([
    "local",
    doesClusterExist(),
    isRuntimeProvisioned(),
    false,
    false,
  ])

  return { location, cluster, runtime, examples, defaults }
}

export type Status = ReturnType<typeof getStatusFromMain>
