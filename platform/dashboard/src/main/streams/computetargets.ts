import { Readable } from "node:stream"

import { getConfig } from "../kubernetes/contexts"
import { clusterNameForKubeconfig as controlPlaneClusterName } from "../controlplane/kind"

/**
 * @return generator of 'ComputeTargetEvent' models
 */
async function* computeTargetsGenerator(): AsyncGenerator<
  import("@jay/common/events/ComputeTargetEvent").default[],
  void,
  undefined
> {
  while (true) {
    try {
      const events = await getConfig().then((config) =>
        (config.contexts || []).map(({ context }) => ({
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
            isJaaSWorkerHost: context.cluster === controlPlaneClusterName, // TODO
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
async function* computeTargetsStringGenerator(): AsyncGenerator<string> {
  for await (const events of computeTargetsGenerator()) {
    yield JSON.stringify(events)
  }
}

/**
 * @return stream of stringified 'ComputeTargetEvent` models
 */
export function startStreamForKubernetesComputeTargets() {
  return Readable.from(computeTargetsStringGenerator())
}
