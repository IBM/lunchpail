type ControlPlaneStatus = {
  /** Does the Kubernetes cluster to house the control plane exist? */
  clusterExists: boolean

  /** Are the core runtime resources provisioned in the management cluster? */
  core: boolean

  /** Are the JaaS examples provisioned in the management cluster? */
  examples: boolean

  /** Are the JaaS default settings provisioned in the management cluster? */
  defaults: boolean
}

export const descriptions: Record<keyof ControlPlaneStatus, string> = {
  clusterExists: "Does the Kubernetes cluster to house the control plane exist?",
  core: "Are the core runtime resources provisioned in the management cluster?",
  examples: "Are the JaaS examples provisioned in the management cluster?",
  defaults: "Are the JaaS default settings provisioned in the management cluster?",
}

export default ControlPlaneStatus
