/**
 * Jobs as a Service API to server-side control plane functionality
 */
export default interface ControlPlaneApi {
  /** @return status of the control plane */
  status(): Promise<import("../status/JobManagerStatus").default>

  /** Bring up the control plane */
  init(): void | Promise<void>

  /** Refresh up the control plane to the latest version */
  update(): void | Promise<void>

  /** Tear down the control plane */
  destroy(): void | Promise<void>
}
