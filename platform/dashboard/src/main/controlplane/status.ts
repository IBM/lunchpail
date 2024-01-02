import { doesClusterExist } from "./management"
import { isRuntimeProvisioned } from "./runtime"
import { isPodmanCliReady, isPodmanMachineReady } from "./podman"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export async function getStatusFromMain(): Promise<import("@jay/common/status/JobManagerStatus").default> {
  const [location, podmanCli, podmanMachine, cluster, runtime] = await Promise.all([
    "local",
    isPodmanCliReady(),
    isPodmanMachineReady(),
    doesClusterExist(),
    isRuntimeProvisioned(),
  ])

  return { location, podmanCli, podmanMachine, cluster, runtime }
}

export type Status = ReturnType<typeof getStatusFromMain>
