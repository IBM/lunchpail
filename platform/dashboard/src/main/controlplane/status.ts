import { doesClusterExist } from "./management"
import { isRuntimeProvisioned } from "./runtime"
import type ControlPlaneStatus from "@jaas/common/status/ControlPlaneStatus"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export async function getStatusFromMain(): Promise<ControlPlaneStatus> {
  const [location, management, runtime, examples, defaults] = await Promise.all([
    "local",
    doesClusterExist(),
    isRuntimeProvisioned(),
    false,
    false,
  ])

  return { location, management, runtime, examples, defaults }
}

export type Status = ReturnType<typeof getStatusFromMain>
