import type KubernetesResource from "./KubernetesResource"

type TaskSimulatorEvent = KubernetesResource<{
  /** DataSet that this TaskSimulator populates */
  dataset: string
}>

export default TaskSimulatorEvent
