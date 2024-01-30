import runs from "./runs"
import datasets from "./datasets"
import taskqueues from "./taskqueues"
import workerpools from "./workerpools"
import applications from "./applications"
import computetargets from "./computetargets"
import workdispatchers from "./workdispatchers"
import platformreposecrets from "./platformreposecrets"

import type ContentProvider from "./ContentProvider"

/**
 * These are the resource Kinds for which we have UI componetry.
 */
const providers = {
  runs,
  computetargets,
  platformreposecrets,
  applications,
  taskqueues,
  datasets,
  workerpools,
  workdispatchers,
}

export type Kind = keyof typeof providers

const uiProviders: Record<Kind, ContentProvider> = providers

export default uiProviders
