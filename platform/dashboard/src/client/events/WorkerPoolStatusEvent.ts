/**
 * An update as to the status of a WorkerPool
 */
export default interface WorkerPoolStatusEvent {
  /** Millis since epoch */
  timestamp: number

  /** Namespace of WorkerPool */
  ns: string

  /** Name of WorkerPool */
  workerpool: string

  /** Applications that this WorkerPool supports */
  applications: string[]

  /** Machine type */
  nodeClass: string

  /** Does this pool support GPU tasks? */
  supportsGpu: boolean

  /** Age of pool */
  age: string

  /** Status of pool */
  status: string

  /** Ready worker count of pool */
  ready: number

  /** Current worker count of pool */
  size: number
}
