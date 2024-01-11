import { isPodmanCliReady, isPodmanMachineReady } from "./podman"
import { doesKindClusterExist, type KubeconfigFile } from "./kind"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export default async function getControlPlaneStatus(
  kubeconfig: KubeconfigFile,
  cluster: string,
): Promise<import("@jay/common/status/JobManagerStatus").default> {
  const [location, podmanCli, podmanMachine, kubernetesCluster] = await Promise.all([
    "local",
    isPodmanCliReady(),
    isPodmanMachineReady(),
    kubeconfig.needsInitialization() ? false : doesKindClusterExist(cluster),
  ])

  return { location, podmanCli, podmanMachine, kubernetesCluster }
}

export type Status = ReturnType<typeof getControlPlaneStatus>
