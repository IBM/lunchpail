import type Method from "./Method"
import type { DefaultValues } from "@jay/components/NewResourceWizard"

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
  }
>

export default Values
