export default interface PlatformRepoSecretEvent {
  /** Millis since epoch */
  timestamp: number

  /** Namespace of PlatformRepoSecret */
  namespace: string

  /** Name of PlatformRepoSecret */
  name: string

  /** Status of Application */
  status: string

  /** Age of PlatformRepoSecret */
  age: string
}
