import datasets from "./datasets"
import taskqueues from "./taskqueues"
import workerpools from "./workerpools"
import controlplane from "./controlplane"
import applications from "./applications"
import platformreposecrets from "./platformreposecrets"

import type ContentProvider from "./ContentProvider"

/**
 * These are the resource Kinds for which we have UI componetry.
 */
const providers = {
  controlplane,
  platformreposecrets,
  applications,
  taskqueues,
  datasets,
  workerpools,
}

type Provider = keyof typeof providers

const uiProviders: Record<Provider, ContentProvider> = providers

export default uiProviders
