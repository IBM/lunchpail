import type KubernetesResource from "./KubernetesResource"

type TaskSimulatorEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "TaskSimulator",
  {
    /** DataSet that this TaskSimulator populates */
    dataset: string
  }
>

export default TaskSimulatorEvent
