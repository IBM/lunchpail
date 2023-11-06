import type KubernetesResource from "./KubernetesResource"

type PlatformRepoSecretEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
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
