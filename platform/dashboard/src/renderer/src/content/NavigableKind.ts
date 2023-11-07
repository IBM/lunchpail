import type WatchedKind from "@jay/common/Kind"
import type DetailableKind from "./DetailableKind"

import uiProviders from "./providers"

/** Special cases: any Kinds we have Detail views for, but we want to exclude from the Nav UI? */
type NavigableKind = Exclude<DetailableKind, "taskqueues">

/** Special cases: any Kinds we have Detail views for, but we want to exclude from the Nav UI? */
export function isNavigableKind(kind: WatchedKind | NavigableKind): kind is NavigableKind {
  return uiProviders[kind] && !!uiProviders[kind].isInSidebar
}

export default NavigableKind
