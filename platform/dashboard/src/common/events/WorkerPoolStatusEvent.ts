import type KubernetesResource from "./KubernetesResource"

/**
 * An update as to the status of a WorkerPool
 */
type WorkerPoolStatusEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "WorkerPool",
  {
    /** Applications that this WorkerPool supports */
    application: {
      name: string
    }

    /** DataSets that this WorkerPool supports */
    dataset: string

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
    "codeflare.dev/ready"?: string
  }
>

export default WorkerPoolStatusEvent
