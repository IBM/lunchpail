import type KubernetesResource from "./KubernetesResource"

type RunEvent = KubernetesResource<
  "codeflare.dev/v1alpha1",
  "Run",
  {
    /** The Application (code + data bindings) this Run uses */
    application: {
      name: string
    }

    /** TODO */
    // options?: string[]

    /** Overrides of environment variables of the `application` */
    env?: Record<string, string>

    /** Number of workers associated with this Run */
    // workers: number

    /** Should this run request GPUs (overriding the Application default)? */
    supportsGpu?: boolean
  },
  {
    /** Associated taskqueue annotation */
    "jaas.dev/taskqueue": string
  }
>

export default RunEvent
