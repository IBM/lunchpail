type JobManagerStatus = {
  /** Where is the control plane running */
  location: string

  /** Does the Kubernetes cluster to house the control plane exist? */
  cluster: boolean

  /** Are the core runtime resources provisioned in the management cluster? */
  runtime: boolean

  /** Are the JaaS examples provisioned in the management cluster? */
  examples: boolean

  /** Are the JaaS default settings provisioned in the management cluster? */
  defaults: boolean
}

export const descriptions: Record<keyof JobManagerStatus, string> = {
  location: "Where is the control plane running?",
  cluster: "Does the Kubernetes cluster to house the control plane exist?",
  runtime: "Are the core runtime resources provisioned in the management cluster?",
  examples: "Are the JaaS examples provisioned in the management cluster?",
  defaults: "Are the JaaS default settings provisioned in the management cluster?",
}

export default JobManagerStatus
