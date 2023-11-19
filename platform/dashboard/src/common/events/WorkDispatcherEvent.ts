import type KubernetesResource from "./KubernetesResource"

type WorkDispatcherEvent = KubernetesResource<"v1", "Pod", { dataset: string }>

export default WorkDispatcherEvent
