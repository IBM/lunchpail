import type KubernetesResource from "./KubernetesResource"

type WorkDispatcherEvent = KubernetesResource<"v1", "Pod", { application: string; dataset: string }>

export default WorkDispatcherEvent
