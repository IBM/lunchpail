import type KubernetesResource from "./KubernetesResource"

/**
 * An update as to the status of a WorkerPool
 */
type WorkerPoolStatusEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "WorkerPool",
  {
    /** Run that this WorkerPool supports */
    run: {
      name: string
    }

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
