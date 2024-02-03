/**
 * Jobs as a Service API to server-side control plane functionality
 */
export default interface ControlPlaneApi {
  /** @return status of the control plane */
  status(cluster: string): Promise<import("../status/ControlPlaneStatus").default>

  /** Bring up the control plane */
  init(cluster: string): void | Promise<void>

  /** Refresh up the control plane to the latest version */
  update(cluster: string): void | Promise<void>

  /** Tear down the control plane */
  destroy(cluster: string): void | Promise<void>
}
