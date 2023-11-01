import type KubernetesResource from "./KubernetesResource"

type ApplicationSpecEvent = KubernetesResource<{
  /** Brief description of this Application */
  description: string

  /** API this Application uses */
  api: string

  /** Base image */
  image: string

  /** Source repo */
  repo: string

  /** Default command line */
  command: string

  /** Does this pool support GPU tasks? */
  supportsGpu: boolean

  inputs?: {
    schema?: { type: string; json: string }
    sizes: { xs?: string; sm?: string; md?: string; lg?: string; xl?: string }
  }[]
}>

export default ApplicationSpecEvent
