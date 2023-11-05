import type KubernetesResource from "./KubernetesResource"

type PlatformRepoSecretEvent = KubernetesResource<{
  repo: string
  secret: {
    name: string
    namespace: string
  }
}>

export default PlatformRepoSecretEvent
