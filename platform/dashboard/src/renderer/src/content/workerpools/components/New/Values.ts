import type { DefaultValues } from "@jay/components/NewResourceWizard"

import type Target from "./Target"

type Values = DefaultValues<{
  target: Target
  kubecontext: string
  name: string
  application: string
  taskqueue: string
  size: string
  count: string
  supportsGpu: string
}>

export default Values
