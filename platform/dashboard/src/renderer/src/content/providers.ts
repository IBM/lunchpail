import type WatchedKind from "@jay/common/Kind"
import type ContentProvider from "./ContentProvider"

import datasets from "./datasets/provider"
import taskqueues from "./taskqueues/provider"
import workerpools from "./workerpools/provider"
import controlplane from "./controlplane/provider"
import applications from "./applications/provider"
import platformreposecrets from "./platformreposecrets/provider"

const providers = {
  controlplane,
  platformreposecrets,
  applications,
  taskqueues,
  datasets,
  workerpools,
}

export type DetailableKind = keyof typeof providers

export default providers
export type { ContentProvider }

export type NavigableKind = Exclude<DetailableKind, "taskqueues">

export function isNavigableKind(kind: WatchedKind | NavigableKind): kind is NavigableKind {
  return providers[kind] && !!providers[kind].isInSidebar
}

export function isDetailableKind(kind: WatchedKind | DetailableKind): kind is DetailableKind {
  return kind in providers
}
