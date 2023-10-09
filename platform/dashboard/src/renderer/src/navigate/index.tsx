import type { MouseEvent } from "react"

/** TODO does this belong here? it seems generally useful, not specific to page navigation */
export function stopPropagation(evt: MouseEvent<HTMLElement>) {
  evt.stopPropagation()
}
