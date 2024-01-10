import { Readable } from "node:stream"

import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"

import { getConfig } from "../kubernetes/contexts"
import { isRuntimeProvisioned } from "../controlplane/runtime"
import { clusterNameForKubeconfig as controlPlaneClusterName, type KubeconfigFile } from "../controlplane/kind"

function ComputeTargetEvent(cluster: string, spec: ComputeTargetEvent["spec"]) {
  return {
    apiVersion: "codeflare.dev/v1alpha1" as const,
    kind: "ComputeTarget" as const,
    metadata: {
      name: cluster === controlPlaneClusterName ? "JaaS Manager" : cluster,
      namespace: "",
      creationTimestamp: new Date().toUTCString(),
      annotations: {
        "codeflare.dev/status": "Running", // TODO?
      },
    },
    spec,
  }
}

/**
 * @return generator of 'ComputeTargetEvent' models
 */
async function* computeTargetsGenerator(
  kubeconfig: Promise<KubeconfigFile>,
): AsyncGenerator<ComputeTargetEvent[], void, undefined> {
  // TODO: instead of this polling loop, use a filewatch-based trigger
  // on ~/.kube/config or $KUBECONFIG?
  while (true) {
    try {
      if ((await kubeconfig).needsInitialization()) {
        // then return a placeholder `ComputeTargetEvent`, so that the
        // UI can show this
        // fact to the user
        yield [
          ComputeTargetEvent(controlPlaneClusterName, {
            isJaaSManager: true,
            isJaaSWorkerHost: false, // not yet initialized as such
            user: { name: "unknown", user: undefined },
            defaultNamespace: "",
          }),
        ]
      } else {
        const config = await getConfig()
        const events = await Promise.all(
          (config.contexts || []).map(async ({ context }) =>
            ComputeTargetEvent(context.cluster, {
              isJaaSManager: context.cluster === controlPlaneClusterName,
              isJaaSWorkerHost: await isRuntimeProvisioned(await kubeconfig, context.cluster, true).catch(() => false),
              user: config.users.find((_) => _.name === context.user) || { name: "user not found", user: false },
              defaultNamespace: context.namespace,
            }),
          ),
        )

        yield events
      }
    } catch (err) {
      console.error(err)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

/**
 * @return generator of stringified 'ComputeTargetEvent` models
 */
async function* computeTargetsStringGenerator(kubeconfig: Promise<KubeconfigFile>): AsyncGenerator<string> {
  for await (const events of computeTargetsGenerator(kubeconfig)) {
    yield JSON.stringify(events)
  }
}

/**
 * @return stream of stringified 'ComputeTargetEvent` models
 */
export function startStreamForKubernetesComputeTargets(kubeconfig: Promise<KubeconfigFile>) {
  return Readable.from(computeTargetsStringGenerator(kubeconfig))
}
