import type KubernetesResource from "./KubernetesResource"

type WorkDispatcherEvent = KubernetesResource<
  "v1",
  "Pod",
  {
    run: string
    dataset: string
    method: string
    sweep?: { min: number; max: number; step: number }
    rate?: { tasks: number; intervalSeconds: number }
  }
>

export default WorkDispatcherEvent
