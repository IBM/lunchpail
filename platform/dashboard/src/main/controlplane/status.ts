import { doesKindClusterExist } from "./kind"
import { isPodmanCliReady, isPodmanMachineReady } from "./podman"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export default async function getControlPlaneStatus(
  cluster: string,
): Promise<import("@jay/common/status/JobManagerStatus").default> {
  const [location, podmanCli, podmanMachine, kubernetesCluster] = await Promise.all([
    "local",
    isPodmanCliReady(),
    isPodmanMachineReady(),
    doesKindClusterExist(cluster),
  ])

  return { location, podmanCli, podmanMachine, kubernetesCluster }
}

export type Status = ReturnType<typeof getControlPlaneStatus>
