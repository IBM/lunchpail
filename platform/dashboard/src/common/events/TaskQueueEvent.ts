import type KubernetesResource from "./KubernetesResource"

type TaskQueueEvent = KubernetesResource<
  "com.ie.ibm.hpsys/v1alpha1",
  "Dataset",
  {
    /** Optionally, to force that this dataset has a particular index in the UI (e.g. for UI coloring) */
    idx?: number

    local: {
      /** e.g. COS vs NFS */
      type: string

      /** Endpoint URL */
      endpoint: string

      /** Prefix filepath */
      bucket: string

      /** Is the data to be provided without write access? */
      readonly: boolean
    }
  }
>

export default TaskQueueEvent
