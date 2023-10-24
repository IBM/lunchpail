export default interface TaskSimulatorEvent {
  /** Millis since epoch */
  timestamp: number

  /** Name of TaskSimulator */
  name: string

  /** Namespace of TaskSimulator */
  namespace: string

  /** DataSet that this TaskSimulator populates */
  dataset: string

  /** Status of TaskSimulator */
  status: string

  /** Age of TaskSimulator */
  age: string
}
