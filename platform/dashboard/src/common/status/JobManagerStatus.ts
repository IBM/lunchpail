type JobManagerStatus = {
  /** Where is the control plane running */
  location: string

  /** Is the podman CLI installed? */
  podmanCli: boolean

  /** Is the podman VM ready to go? */
  podmanMachine: boolean

  /** Does the Kubernetes cluster to house the control plane exist? */
  kubernetesCluster: boolean

  /** Are the core runtime resources provisioned in the management cluster? */
  jaasRuntime: boolean

  /** Are the JaaS examples provisioned in the management cluster? */
  // examples: boolean

  /** Are the JaaS default settings provisioned in the management cluster? */
  // defaults: boolean
}

export const descriptions: Record<keyof JobManagerStatus, string> = {
  location: "Where is the control plane running?",
  podmanCli: "Is the podman CLI installed?",
  podmanMachine: "Is the podman VM ready to go?",
  kubernetesCluster: "Does the Kubernetes cluster to house the control plane exist?",
  jaasRuntime: "Are the core runtime resources provisioned in the management cluster?",
  // examples: "Are the JaaS examples provisioned in the management cluster?",
  // defaults: "Are the JaaS default settings provisioned in the management cluster?",
}

export default JobManagerStatus
