import type KubernetesResource from "./KubernetesResource"

type PlatformRepoSecretEvent = KubernetesResource<
  "lunchpail.io/v1alpha1",
  "PlatformRepoSecret",
  {
    repo: string
    secret: {
      name: string
      namespace: string
    }
  }
>

export default PlatformRepoSecretEvent
