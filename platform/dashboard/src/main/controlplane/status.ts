import { clusterExists } from "../prereq/check"
import type ControlPlaneStatus from "@jaas/common/status/ControlPlaneStatus"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export async function getStatusFromMain(): Promise<ControlPlaneStatus> {
  return { location: "local", management: await clusterExists(), runtime: true, examples: false, defaults: false }
}

export type Status = ReturnType<typeof getStatusFromMain>
