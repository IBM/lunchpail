import type KubernetesResource from "./KubernetesResource"

/**
 * An update as to the status of a WorkerPool
 */
type WorkerPoolStatusEvent = KubernetesResource<
  "lunchpail.io/v1alpha1",
  "WorkerPool",
  {
    /** Run that this WorkerPool supports */
    run: string

    /** Attributes of the workers */
    workers: {
      /** Current worker count of pool */
      count: number

      /** Machine type */
      size: string

      /** Does this pool support GPU tasks? */
      supportsGpu: boolean
    }
  },
  {
    /** Ready count (TODO) */
    "lunchpail.io/ready"?: string
  }
>

export default WorkerPoolStatusEvent
