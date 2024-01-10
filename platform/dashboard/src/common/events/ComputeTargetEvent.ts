import type KubernetesResource from "./KubernetesResource"

type ComputeTargetEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "ComputeTarget",
  {
    /** Is this cluster the head manager of resources? */
    isJaaSManager?: boolean

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
