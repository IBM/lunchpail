import type { DefaultValues } from "@jaas/components/NewResourceWizard"

type Values = DefaultValues<{
  /** Name of ComputeTarget */
  context: string

  /** Optional environment variables to associate with the workers */
  env?: string

  name: string
  application: string
  taskqueue: string
  size: string
  count: string
  supportsGpu: string
}>

export default Values
