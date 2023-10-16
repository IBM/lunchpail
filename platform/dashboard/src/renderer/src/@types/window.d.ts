/** Jobs as a Service API to server-side resource functionality */
export interface JaasResourceApi {
  /** Handle events with the given callback `cb` */
  on(source: "message", cb: (...args: unknown[]) => void): void
}

/** Jobs as a Service API to server-side control plane functionality */
export interface ControlPlaneApi {
  /** @return status of the control plane */
  status(): Promise<{
    clusterExists: boolean
    core: boolean
    example: boolean
  }>

  /** Bring up the control plane */
  init(): Promise<void>

  /** Tear down the control plane */
  destroy(): Promise<void>
}

/** Valid resource types */
type Kind = "workerpools" | "queues" | "datasets" | "applications"

/** Jobs as a Service API to server-side functionality */
export interface JaasApi extends Record<Kind, JaasResourceApi> {
  /** Create a resource */
  createResource(yaml: string): Promise<void>

  /** Jobs as a Service API to server-side control plane functionality */
  controlplane: ControlPlaneApi
}

declare global {
  interface Window {
    jaas: JaasApi
  }
}
