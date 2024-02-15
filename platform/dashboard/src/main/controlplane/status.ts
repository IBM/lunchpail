import { doesKindClusterExist, isKindClusterOnline } from "./kind"
import { containerCliUsed, containerRuntimeUsed } from "./containers"
import { maybeHackToRestoreKindAfterPodmanRestart } from "./podman"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export default async function getControlPlaneStatus(
  cluster: string,
): Promise<import("@jaas/common/status/ControlPlaneStatus").default> {
  const [containerCLI, containerRuntime, containerRuntimeOnline, kubernetesClusterExists, kubernetesClusterOnline] =
    await Promise.all([
      containerCliUsed(),
      ...(await containerRuntimeUsed()),
      doesKindClusterExist(cluster),
      isKindClusterOnline(cluster),
    ])

  if (containerRuntime === "podman") {
    await maybeHackToRestoreKindAfterPodmanRestart(cluster, containerRuntimeOnline, kubernetesClusterOnline)
  }

  return { containerCLI, containerRuntime, containerRuntimeOnline, kubernetesClusterExists, kubernetesClusterOnline }
}

export type Status = ReturnType<typeof getControlPlaneStatus>
