import type Kind from "../Kind"
import ExecResponse from "@jay/common/events/ExecResponse"

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

/** Jobs as a Service API to server-side control plane functionality */
export interface ControlPlaneApi {
  /** @return status of the control plane */
  status(): Promise<import("../status/JobManagerStatus").default>

  /** Bring up the control plane */
  init(): void | Promise<void>

  /** Refresh up the control plane to the latest version */
  update(): void | Promise<void>

  /** Tear down the control plane */
  destroy(): void | Promise<void>
}

export type DeleteProps = { kind: string; name: string; namespace: string }

/** Jobs as a Service API to server-side functionality */
export default interface JayApi extends Record<Kind, JayResourceApi> {
  /** Create a resource */
  create(values: Record<string, string>, yaml: string, dryRun?: boolean): ExecResponse | Promise<ExecResponse>

  /** Delete a resource */
  delete(props: DeleteProps): ExecResponse | Promise<ExecResponse>

  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi
}
