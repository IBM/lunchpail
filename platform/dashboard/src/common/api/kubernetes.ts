import type Kind from "../Kind"
import type ExecResponse from "../events/ExecResponse"
import type ComputeTargetEvent from "../events/ComputeTargetEvent"
import type KubernetesResource from "../events/KubernetesResource"

export type DeleteProps = { kind: Kind | "dataset" | "secret"; name: string; namespace: string; context?: string }

export type KubeUser = { name: string; user: unknown }

export type KubeConfig = KubernetesResource<"v1", "Config"> & {
  "current-context": string
  users: KubeUser[]
  clusters: { name: string; cluster: unknown }[]
  contexts: { name: string; context: { cluster: string; user: string; namespace: string } }[]
}

export type OnModelUpdateFn = (_: unknown, model: { data: string }) => void
type CleanupFn = () => void

/** Jobs as a Service API to server-side resource functionality */
export interface JaasResourceApi {
  /**
   * Handle events with the given callback `cb`.
   * @return a function that will clean up any underlying watchers.
   */
  on(source: "message", cb: OnModelUpdateFn): CleanupFn
}

export default interface KubernetesApi extends Record<Kind, JaasResourceApi> {
  /** Available Kubernetes contexts */
  contexts?(): Promise<{ config: KubeConfig; current: string }>

  /** Delete the given named `ComputeTarget` */
  deleteComputeTarget(target: ComputeTargetEvent)

  /** Fetch a resource */
  get?: <R extends KubernetesResource>(props: DeleteProps) => R | Promise<R>

  /** Create a resource */
  create(
    values: Record<string, string>,
    yaml: string,
    context?: string,
    dryRun?: boolean,
  ): ExecResponse | Promise<ExecResponse>

  /** Delete a resource */
  delete(yaml: string, context?: string): ExecResponse | Promise<ExecResponse>

  /** Delete a resource by name */
  deleteByName(props: DeleteProps): ExecResponse | Promise<ExecResponse>

  /** Tail on logs for a given resource */
  logs?(selector: string, namespace: string, follow: boolean, cb: (chunk: string) => void): CleanupFn
}
