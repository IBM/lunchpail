/**
 * An update as to the spec of an Application
 */
export default interface ApplicationSpecEvent {
  /** Millis since epoch */
  timestamp: number

  /** Namespace of WorkerPool */
  ns: string

  /** Name of Application */
  application: string

  /** API this Application uses */
  api: string

  /** Base image */
  image: string

  /** Default command line */
  command: string

  /** Does this pool support GPU tasks? */
  supportsGpu: boolean

  /** Age of Application */
  age: string
}
