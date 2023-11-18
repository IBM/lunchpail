import type KubernetesResource from "./KubernetesResource"

type WorkDispatcherEvent = KubernetesResource<"v1", "Pod", unknown>

export default WorkDispatcherEvent
