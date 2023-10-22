import type Kind from "../Kind"

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

  /** Tear down the control plane */
  destroy(): void | Promise<void>
}

export type DeleteProps = { kind: string; name: string; namespace: string }

/** Jobs as a Service API to server-side functionality */
export default interface JayApi extends Record<Kind, JayResourceApi> {
  /** Create a resource */
  create(values: Record<string, string>, yaml: string): boolean | Promise<boolean>

  /** Delete a resource */
  delete(props: DeleteProps): boolean | Promise<boolean>

  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi
}
