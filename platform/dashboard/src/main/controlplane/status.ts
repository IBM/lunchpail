import { doesKindClusterExist } from "./kind"
import { containerCliUsed, containerRuntimeUsed } from "./containers"

/**
 * Check to see if we have a control plane cluster and facilities running
 */
export default async function getControlPlaneStatus(
  cluster: string,
): Promise<import("@jaas/common/status/ControlPlaneStatus").default> {
  const [containerCLI, containerRuntime, containerRuntimeOnline, kubernetesClusterExists] = await Promise.all([
    containerCliUsed(),
    ...(await containerRuntimeUsed()),
    doesKindClusterExist(cluster),
  ])

  return { containerCLI, containerRuntime, containerRuntimeOnline, kubernetesClusterExists }
}

export type Status = ReturnType<typeof getControlPlaneStatus>
