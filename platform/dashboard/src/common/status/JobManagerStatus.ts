export default interface ControlPlaneStatus {
  /** Is the podman CLI installed? */
  podmanCli: boolean

  /** Is the podman VM ready to go? */
  podmanMachine: boolean

  /** Does the Kubernetes cluster to house the control plane exist? */
  kubernetesCluster: boolean

  /** Are the JaaS examples provisioned in the management cluster? */
  // examples: boolean

  /** Are the JaaS default settings provisioned in the management cluster? */
  // defaults: boolean
}

export const descriptions: Record<keyof ControlPlaneStatus, string> = {
  podmanCli: "Is the podman CLI installed?",
  podmanMachine: "Is the podman VM ready to go?",
  kubernetesCluster: "Does the Kubernetes cluster to house the control plane exist?",
  // examples: "Are the JaaS examples provisioned in the management cluster?",
  // defaults: "Are the JaaS default settings provisioned in the management cluster?",
}
