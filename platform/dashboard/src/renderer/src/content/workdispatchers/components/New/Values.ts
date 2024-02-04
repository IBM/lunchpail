import type Method from "./Method"
import type { DefaultValues } from "@jaas/components/NewResourceWizard"

type Values = DefaultValues<
  {
    method: Method
    tasks: string
    intervalSeconds: string
    inputFormat: string
    inputSchema: string
    min: string
    max: string
    step: string
    repo: string
    values: string
  } & {
    name: string
    namespace: string
    description: string

    /** Name of ComputeTarget */
    context: string
  }
>

export default Values
