import { Readable } from "node:stream"
import { EventEmitter } from "node:events"

import type ComputeTargetEvent from "@jay/common/events/ComputeTargetEvent"

import { getConfig } from "../kubernetes/contexts"
import getComputeTargetType from "../controlplane/type"
import getControlPlaneStatus from "../controlplane/status"
import { isRuntimeProvisioned } from "../controlplane/runtime"
import { isKindCluster, clusterNameForKubeconfig as controlPlaneClusterName } from "../controlplane/kind"

const computetargetEvents = new EventEmitter()

export function onDiscoveredComputeTarget(handler: (context: string) => void) {
  computetargetEvents.on("/discovered", handler)
}

export function offDiscoveredComputeTarget(handler: (context: string) => void) {
  computetargetEvents.off("/discovered", handler)
}

export function onDeletedComputeTarget(context: string, handler: () => void) {
  computetargetEvents.on(`/deleted/${context}`, handler)
}

export function offDeletedComputeTarget(context: string, handler: () => void) {
  computetargetEvents.off(`/deleted/${context}`, handler)
}

const knownComputeTargets: Record<string, true> = {}

function emitDiscoveredComputeTargetFromName(context: string) {
  if (!(context in knownComputeTargets)) {
    knownComputeTargets[context] = true
    computetargetEvents.emit("/discovered", context)
  }
}

function emitDiscoveredComputeTarget(event: ComputeTargetEvent) {
  if (event.spec.isJaaSWorkerHost) {
    emitDiscoveredComputeTargetFromName(event.metadata.name)
  }
}

function emitDeletedComputeTarget(context: string) {
  delete knownComputeTargets[context]
  computetargetEvents.emit(`/deleted/${context}`)
}

/** Construct a new `ComputeTargetEvent` */
function ComputeTargetEvent(cluster: string, spec: Omit<ComputeTargetEvent["spec"], "type">) {
  return {
    apiVersion: "codeflare.dev/v1alpha1" as const,
    kind: "ComputeTarget" as const,
    metadata: {
      name: cluster,
      namespace: "",
      context: cluster,
      creationTimestamp: new Date().toUTCString(),
      annotations: {
        "codeflare.dev/status": spec.jaasManager ? (spec.isJaaSWorkerHost ? "Online" : "HostConfigured") : "Offline",
      },
    },
    spec: Object.assign({ type: getComputeTargetType(cluster) }, spec),
  }
}

/**
 * Construct a new `ComputeTargetEvent` for the main/managent cluster
 * when we are starting from a blank slate, e.g., a laptop that needs
 * initialization.
 */
async function Placeholder() {
  return ComputeTargetEvent(controlPlaneClusterName, {
    jaasManager: await getControlPlaneStatus(controlPlaneClusterName),
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
async function* computeTargetsGenerator(): AsyncGenerator<ComputeTargetEvent[], void, undefined> {
  // TODO: instead of this polling loop, use a filewatch-based trigger
  // on ~/.kube/config or $KUBECONFIG?
  while (true) {
    try {
      /*if ((await kubeconfig).needsInitialization()) {
        // then return a placeholder `ComputeTargetEvent`, so that the
        // UI can show this fact to the user
        yield [await Placeholder(await kubeconfig)]
      } else*/ {
        // Otherwise, we have a JaaS control plane. Query it for the
        // list of Kubernetes contexts, and transform these into
        // `ComputeTargetEvents`.
        const config = await getConfig()
        const events = await Promise.all(
          (config.contexts || []).map(async ({ context }) => {
            const [jaasManager, isJaaSWorkerHost] = await Promise.all([
              context.cluster !== controlPlaneClusterName ? (false as const) : getControlPlaneStatus(context.cluster),
              isRuntimeProvisioned(context.cluster, true).catch(() => false),
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
          events.push(await Placeholder())
        }

        yield events
      }
    } catch (err) {
      if (/ENOENT/.test(String(err))) {
        console.error("kubectl not found")
      } else {
        console.error(err)
      }
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

  for (const [key, value] of Object.entries(B)) {
    if (!(key in A)) {
      emitDiscoveredComputeTarget(value)
    }
  }

  for (const [key, value] of Object.entries(A)) {
    if (!(key in B)) {
      current.push(terminating(value))
      emitDeletedComputeTarget(value.metadata.name)
    }
  }

  return current
}

/**
 * @return generator of stringified 'ComputeTargetEvent` models, also including notification of deletions
 */
async function* computeTargetsStringGenerator(): AsyncGenerator<string> {
  let previousModel: ComputeTargetEvent[] | null = null
  for await (const events of computeTargetsGenerator()) {
    if (previousModel !== null) {
      addDeletions(previousModel, events)
    } else {
      events.forEach(emitDiscoveredComputeTarget)
    }
    previousModel = events
    yield JSON.stringify(events)
  }
}

/**
 * @return stream of stringified 'ComputeTargetEvent` models
 */
export function startStreamForKubernetesComputeTargets() {
  return Readable.from(computeTargetsStringGenerator())
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

import { type ComputeTarget } from "@jay/common/events/ComputeTargetEvent"
export async function createComputeTarget(
  target: ComputeTarget,
  dryRun = false,
  provisionRuntime = true,
): Promise<import("@jay/common/events/ExecResponse").default> {
  if (target.spec.type === "Kind") {
    try {
      await import("../controlplane/install").then((_) =>
        _.default("lite", "apply", "kind-" + target.metadata.name, dryRun, provisionRuntime),
      )
      return true
    } catch (err) {
      return { code: 1, message: hasMessage(err) ? err.message : "Internal Error creating ComputeTarget" }
    }
  } else {
    return { code: 1, message: "Creattion of given ComputeTarget not supported" }
  }
}

export const kind = "ComputeTarget"
export const apiVersion = "codeflare.dev/v1alpha1"

export function isComputeTarget(json: unknown): json is ComputeTarget {
  return (
    typeof json === "object" &&
    json !== null &&
    (json as ComputeTarget).apiVersion === apiVersion &&
    (json as ComputeTarget).kind === kind
  )
}
