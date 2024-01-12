import type KubernetesResource from "./KubernetesResource"
import type ControlPlaneStatus from "../status/JobManagerStatus"

type ComputeTargetEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "ComputeTarget",
  {
    /** What kind of cluster is this? */
    type: "Kind" | "Kubernetes" | "OpenShift"

    /** Is this cluster the head manager of resources? */
    jaasManager: false | ControlPlaneStatus

    /** Is this cluster enabled to run workers? */
    isJaaSWorkerHost?: boolean

    /** Does JaaS support deleting this ComputeTarget? */
    isDeletable?: boolean

    /** If not specified, resources will be assumed to be in this namespace */
    defaultNamespace: string

    /** User credentials for accessing the cluster */
    user: import("../api/kubernetes").KubeUser
  }
>

export default ComputeTargetEvent
