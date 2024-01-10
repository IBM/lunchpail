import { isRuntimeProvisioned } from "./runtime"
import { isPodmanCliReady, isPodmanMachineReady } from "./podman"
import { doesKindClusterExist, type KubeconfigFile } from "./kind"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export default async function getControlPlaneStatus(
  kubeconfig: KubeconfigFile,
): Promise<import("@jay/common/status/JobManagerStatus").default> {
  const [location, podmanCli, podmanMachine, kubernetesCluster, jaasRuntime] = await Promise.all([
    "local",
    isPodmanCliReady(),
    isPodmanMachineReady(),
    kubeconfig.needsInitialization() ? false : doesKindClusterExist(),
    kubeconfig.needsInitialization() ? false : isRuntimeProvisioned(kubeconfig),
  ])

  return { location, podmanCli, podmanMachine, kubernetesCluster, jaasRuntime }
}

export type Status = ReturnType<typeof getControlPlaneStatus>
