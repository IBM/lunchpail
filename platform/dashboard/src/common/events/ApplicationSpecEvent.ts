import type KubernetesResource from "./KubernetesResource"

type ApplicationSpecEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "Application",
  {
    /** Brief description of this Application */
    description: string

    /** Optional tags to help categorize this Application */
    tags?: string[]

    /** API this Application uses */
    api: string

    /** Base image */
    image: string

    /** Source repo */
    repo: string

    /** Source code literal */
    code?: string

    /** Default command line */
    command: string

    /** Does this pool support GPU tasks? */
    supportsGpu: boolean

    inputs?: {
      schema?: { format: string; json: string }
      sizes: { xs?: string; sm?: string; md?: string; lg?: string; xl?: string }
    }[]
  }
>

export default ApplicationSpecEvent
