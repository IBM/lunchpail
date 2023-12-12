import type Kind from "../Kind"
import type ExecResponse from "../events/ExecResponse"
import type KubernetesResource from "../events/KubernetesResource"

import type S3Api from "./s3"
import type ControlPlaneApi from "./ControlPlane"

export type OnModelUpdateFn = (_: unknown, model: { data: string }) => void
type CleanupFn = () => void

/** Jobs as a Service API to server-side resource functionality */
export interface JayResourceApi {
  /**
   * Handle events with the given callback `cb`.
   * @return a function that will clean up any underlying watchers.
   */
  on(source: "message", cb: OnModelUpdateFn): CleanupFn
}

export type DeleteProps = { kind: string; name: string; namespace: string }

/** Jobs as a Service API to server-side functionality */
export default interface JayApi extends Record<Kind, JayResourceApi> {
  /** Available Kubernetes contexts */
  contexts?(): Promise<{ contexts: string[]; current: string }>

  /** Fetch a resource */
  get?: <R extends KubernetesResource>(props: DeleteProps) => R | Promise<R>

  /** Create a resource */
  create(values: Record<string, string>, yaml: string, dryRun?: boolean): ExecResponse | Promise<ExecResponse>

  /** Delete a resource */
  delete(yaml: string): ExecResponse | Promise<ExecResponse>

  /** Delete a resource by name */
  deleteByName(props: DeleteProps): ExecResponse | Promise<ExecResponse>

  /** Tail on logs for a given resource */
  logs?(selector: string, namespace: string, follow: boolean, cb: (chunk: string) => void): CleanupFn

  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi

  /** S3 API */
  s3?: S3Api
}
