import type Kind from "../Kind"

type OnModelUpdateFn = (_: unknown, model: { data: string }) => void
type CleanupFn = () => void

/** Jobs as a Service API to server-side resource functionality */
export interface JayResourceApi {
  /** Handle events with the given callback `cb` */
  on(source: "message", cb: OnModelUpdateFn): CleanupFn
}

/** Jobs as a Service API to server-side control plane functionality */
export interface ControlPlaneApi {
  /** @return status of the control plane */
  status(): Promise<import("../status/JobManagerStatus").default>

  /** Bring up the control plane */
  init(): Promise<void>

  /** Tear down the control plane */
  destroy(): Promise<void>
}

/** Jobs as a Service API to server-side functionality */
export default interface JayApi extends Record<Kind, JayResourceApi> {
  /** Create a resource */
  createResource(yaml: string): Promise<boolean>

  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi
}
