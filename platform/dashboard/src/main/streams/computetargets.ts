import { Readable } from "node:stream"

import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"

import { getConfig } from "../kubernetes/contexts"
import getControlPlaneStatus from "../controlplane/status"
import { isRuntimeProvisioned } from "../controlplane/runtime"
import {
  isKindCluster,
  clusterNameForKubeconfig as controlPlaneClusterName,
  type KubeconfigFile,
} from "../controlplane/kind"

/** Construct a new `ComputeTargetEvent` */
function ComputeTargetEvent(cluster: string, spec: ComputeTargetEvent["spec"]) {
  return {
    apiVersion: "codeflare.dev/v1alpha1" as const,
    kind: "ComputeTarget" as const,
    metadata: {
      name: cluster,
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
 * Construct a new `ComputeTargetEvent` for the main/managent cluster
 * when we are starting from a blank slate, e.g., a laptop that needs
 * initialization.
 */
async function Placeholder(kubeconfig: KubeconfigFile) {
  return ComputeTargetEvent(controlPlaneClusterName, {
    jaasManager: await getControlPlaneStatus(await kubeconfig, controlPlaneClusterName),
    isJaaSWorkerHost: false, // not yet initialized as such
    user: { name: "unknown", user: undefined },
    defaultNamespace: "",
  })
}

/** Morph `event` to be in a Terminating state */
function terminating(event: ComputeTargetEvent) {
  event.metadata.annotations["codeflare.dev/status"] = "Terminating"
  return event
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
        // UI can show this fact to the user
        yield [await Placeholder(await kubeconfig)]
      } else {
        // Otherwise, we have a JaaS control plane. Query it for the
        // list of Kubernetes contexts, and transform these into
        // `ComputeTargetEvents`.
        const config = await getConfig()
        const events = await Promise.all(
          (config.contexts || []).map(async ({ context }) => {
            const [jaasManager, isJaaSWorkerHost] = await Promise.all([
              context.cluster !== controlPlaneClusterName
                ? (false as const)
                : getControlPlaneStatus(await kubeconfig, context.cluster),
              isRuntimeProvisioned(await kubeconfig, context.cluster, true).catch(() => false),
            ])

            return ComputeTargetEvent(context.cluster, {
              jaasManager,
              isJaaSWorkerHost,
              isDeletable: isKindCluster(context),
              defaultNamespace: context.namespace,
              user: config.users.find((_) => _.name === context.user) || { name: "user not found", user: false },
            })
          }),
        )

        if (!events.find((_) => _.metadata.name === controlPlaneClusterName)) {
          // then the controlplane cluster went away, perhaps the user
          // deleted it outside of our purview
          events.push(await Placeholder(await kubeconfig))
        }

        yield events
      }
    } catch (err) {
      console.error(err)
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
}

/**
 * Add any events in `previous` that aren't in `current`, but
 * transformed to be in a Terminating state.
 */
function addDeletions(previous: ComputeTargetEvent[], current: ComputeTargetEvent[]) {
  const A = previous.reduce(
    (M, e) => {
      M[e.metadata.name] = e
      return M
    },
    {} as Record<string, ComputeTargetEvent>,
  )
  const B = current.reduce(
    (M, e) => {
      M[e.metadata.name] = e
      return M
    },
    {} as Record<string, ComputeTargetEvent>,
  )

  for (const [key, value] of Object.entries(A)) {
    if (!(key in B)) {
      current.push(terminating(value))
    }
  }

  return current
}

/**
 * @return generator of stringified 'ComputeTargetEvent` models, also including notification of deletions
 */
async function* computeTargetsStringGenerator(kubeconfig: Promise<KubeconfigFile>): AsyncGenerator<string> {
  let previousModel: ComputeTargetEvent[] | null = null
  for await (const events of computeTargetsGenerator(kubeconfig)) {
    if (previousModel !== null) {
      addDeletions(previousModel, events)
    }
    previousModel = events
    yield JSON.stringify(events)
  }
}

/**
 * @return stream of stringified 'ComputeTargetEvent` models
 */
export function startStreamForKubernetesComputeTargets(kubeconfig: Promise<KubeconfigFile>) {
  return Readable.from(computeTargetsStringGenerator(kubeconfig))
}

import { hasMessage } from "../kubernetes/create"
export async function deleteComputeTarget(
  target: ComputeTargetEvent,
): Promise<import("@jay/common/events/ExecResponse").default> {
  if (target.spec.isDeletable) {
    try {
      const { stdout } = await import("../controlplane/kind").then((_) => _.deleteKindCluster(target.metadata.name))
      return { code: 0, message: stdout }
    } catch (err) {
      return { code: 1, message: hasMessage(err) ? err.message : "Internal Error deleting ComputeTarget" }
    }
  } else {
    return { code: 1, message: "Deletion of given ComputeTarget not supported" }
  }
}
