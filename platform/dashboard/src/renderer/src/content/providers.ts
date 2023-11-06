import type { DetailableKind } from "../Kind"
import type ContentProvider from "./ContentProvider"

import datasets from "./datasets/provider"
import taskqueues from "./taskqueues/provider"
import workerpools from "./workerpools/provider"
import controlplane from "./controlplane/provider"
import applications from "./applications/provider"
import platformreposecrets from "./platformreposecrets/provider"

const providers: Record<DetailableKind, ContentProvider> = {
  controlplane,
  platformreposecrets,
  applications,
  taskqueues,
  datasets,
  workerpools,
}

export default providers
