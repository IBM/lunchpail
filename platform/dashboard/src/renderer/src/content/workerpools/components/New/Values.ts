import type { DefaultValues } from "@jaas/components/NewResourceWizard"

type Values = DefaultValues<{
  /** Name of ComputeTarget */
  context: string

  /** Optional environment variables to associate with the workers */
  env?: string

  /** Name of WorkerPool to be created */
  name: string

  /** Run to associate with */
  run: string

  size: string
  count: string
  supportsGpu: string
}>

export default Values
