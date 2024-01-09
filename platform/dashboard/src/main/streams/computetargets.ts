import { Readable } from "node:stream"

import { getConfig } from "../kubernetes/contexts"
import { isRuntimeProvisioned } from "../controlplane/runtime"
import { clusterNameForKubeconfig as controlPlaneClusterName } from "../controlplane/kind"

/**
 * @return generator of 'ComputeTargetEvent' models
 */
async function* computeTargetsGenerator(
  kubeconfig: Promise<string>,
): AsyncGenerator<import("@jay/common/events/ComputeTargetEvent").default[], void, undefined> {
  const kubeconfigPath = { path: await kubeconfig }

  while (true) {
    try {
      const config = await getConfig()
      const events = await Promise.all(
        (config.contexts || []).map(async ({ context }) => ({
          apiVersion: "codeflare.dev/v1alpha1" as const,
          kind: "ComputeTarget" as const,
          metadata: {
            name: context.cluster === controlPlaneClusterName ? "JaaS Manager" : context.cluster,
            namespace: "",
            creationTimestamp: new Date().toUTCString(),
            annotations: {
              "codeflare.dev/status": "Running",
            },
          },
          spec: {
            isJaaSManager: context.cluster === controlPlaneClusterName,
            isJaaSWorkerHost: await isRuntimeProvisioned(context.cluster, true, kubeconfigPath).catch(() => false),
            user: config.users.find((_) => _.name === context.user) || { name: "user not found", user: false },
            defaultNamespace: context.namespace,
          },
        })),
      )

      yield events
    } catch (err) {
      console.error(err)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

/**
 * @return generator of stringified 'ComputeTargetEvent` models
 */
async function* computeTargetsStringGenerator(kubeconfig: Promise<string>): AsyncGenerator<string> {
  for await (const events of computeTargetsGenerator(kubeconfig)) {
    yield JSON.stringify(events)
  }
}

/**
 * @return stream of stringified 'ComputeTargetEvent` models
 */
export function startStreamForKubernetesComputeTargets(kubeconfig: Promise<string>) {
  return Readable.from(computeTargetsStringGenerator(kubeconfig))
}
