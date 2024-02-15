export default interface ControlPlaneStatus {
  /** Which container CLI can be user with the user's selected container runtime?
   * null means the suitable container CLI was not found on the user's system.
   */
  containerCLI: "docker" | "podman" | null

  /** Which container runtime is installed on the user's system?
   * null means no container runtime was found on the user's system.
   */
  containerRuntime: "docker-engine" | "podman" | null

  /** Is the container runtime online? */
  containerRuntimeOnline: boolean

  /** Does the Kubernetes cluster to house the control plane exist? */
  kubernetesClusterExists: boolean

  /** Is the Kubernetes cluster online? */
  kubernetesClusterOnline: boolean

  /** Are the JaaS examples provisioned in the management cluster? */
  // examples: boolean

  /** Are the JaaS default settings provisioned in the management cluster? */
  // defaults: boolean
}

export const descriptions: Record<keyof ControlPlaneStatus, string> = {
  containerCLI: "Is the container CLI installed?",
  containerRuntime: "Does the container runtime exist?",
  containerRuntimeOnline: "Is the container runtime online?",
  kubernetesClusterExists: "Does the Kubernetes cluster to house the control plane exist?",
  kubernetesClusterOnline: "Is the Kubernetes cluster online?",
  // examples: "Are the JaaS examples provisioned in the management cluster?",
  // defaults: "Are the JaaS default settings provisioned in the management cluster?",
}
