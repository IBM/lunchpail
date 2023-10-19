type ControlPlaneStatus = {
  /** Where is the control plane running */
  location: string

  /** Does the Kubernetes cluster to house the control plane exist? */
  controlPlane: boolean

  /** Are the core runtime resources provisioned in the management cluster? */
  runtime: boolean

  /** Are the JaaS examples provisioned in the management cluster? */
  examples: boolean

  /** Are the JaaS default settings provisioned in the management cluster? */
  defaults: boolean
}

export const descriptions: Record<keyof ControlPlaneStatus, string> = {
  location: "Where is the control plane running?",
  controlPlane: "Does the Kubernetes cluster to house the control plane exist?",
  runtime: "Are the core runtime resources provisioned in the management cluster?",
  examples: "Are the JaaS examples provisioned in the management cluster?",
  defaults: "Are the JaaS default settings provisioned in the management cluster?",
}

export default ControlPlaneStatus
