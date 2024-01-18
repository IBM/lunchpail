import type { DefaultValues } from "@jay/components/NewResourceWizard"

type Values = DefaultValues<{
  /** Name of ComputeTarget */
  target: string

  name: string
  application: string
  taskqueue: string
  size: string
  count: string
  supportsGpu: string
}>

export default Values
