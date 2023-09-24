/**
 * An update as to the spec of an Application
 */
export default interface ApplicationSpecEvent {
  /** Millis since epoch */
  timestamp: number

  /** Namespace of WorkerPool */
  namespace: string

  /** Name of Application */
  application: string

  /** Brief description of this Application */
  description: string

  /** API this Application uses */
  api: string

  /** Base image */
  image: string

  /** Source repo */
  repo: string

  /** Default command line */
  command: string

  /** Does this pool support GPU tasks? */
  supportsGpu: boolean

  /** Age of Application */
  age: string
}
