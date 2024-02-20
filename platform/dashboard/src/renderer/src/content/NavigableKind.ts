import type WatchedKind from "@jaas/common/Kind"
import type DetailableKind from "./DetailableKind"

import uiProviders from "./providers"

/** Special cases: any Kinds we have Detail views for, but we want to exclude from the Nav UI? */
type NavigableKind = DetailableKind

/** Special cases: any Kinds we have Detail views for, but we want to exclude from the Nav UI? */
export function isNavigableKind(kind: WatchedKind | NavigableKind): kind is NavigableKind {
  return uiProviders[kind] && !!uiProviders[kind].isInSidebar
}

export default NavigableKind
