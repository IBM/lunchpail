import { doesClusterExist } from "./management"
import { isRuntimeProvisioned } from "./runtime"
import { isPodmanCliReady, isPodmanMachineReady } from "./podman"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export async function getStatusFromMain(): Promise<import("@jay/common/status/JobManagerStatus").default> {
  const [location, podmanCli, podmanMachine, kubernetesCluster, jaasRuntime] = await Promise.all([
    "local",
    isPodmanCliReady(),
    isPodmanMachineReady(),
    doesClusterExist(),
    isRuntimeProvisioned(),
  ])

  return { location, podmanCli, podmanMachine, kubernetesCluster, jaasRuntime }
}

export type Status = ReturnType<typeof getStatusFromMain>
