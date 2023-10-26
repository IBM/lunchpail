import type KubernetesResource from "./KubernetesResource"

/**
 * An update as to the status of a WorkerPool
 */
type WorkerPoolStatusEvent = KubernetesResource<{
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
}>

export default WorkerPoolStatusEvent
