import type WatchedKind from "@jay/common/Kind"

import uiProviders from "./providers"

/** Do we have a Detail view? */
type DetailableKind = keyof typeof uiProviders

/** Do we have a Detail view? */
export function isDetailableKind(kind: WatchedKind | DetailableKind): kind is DetailableKind {
  return kind in uiProviders
}

export default DetailableKind
