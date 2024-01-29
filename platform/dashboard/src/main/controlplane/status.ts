import { doesKindClusterExist } from "./kind"
import { isPodmanCliReady, isPodmanMachineReady } from "./podman"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export default async function getControlPlaneStatus(
  cluster: string,
): Promise<import("@jaas/common/status/JobManagerStatus").default> {
  const [podmanCli, podmanMachineExists, podmanMachineOnline, kubernetesCluster] = await Promise.all([
    isPodmanCliReady(),
    ...(await isPodmanMachineReady()),
    doesKindClusterExist(cluster),
  ])

  return { podmanCli, podmanMachineExists, podmanMachineOnline, kubernetesCluster }
}

export type Status = ReturnType<typeof getControlPlaneStatus>
