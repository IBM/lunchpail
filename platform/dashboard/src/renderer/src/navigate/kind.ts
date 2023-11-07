import { useLocation } from "react-router-dom"

import type { NavigableKind } from "../content/providers"

const defaultKind: NavigableKind = "controlplane"

export function hash(kind: NavigableKind) {
  return "#" + kind
}

/**
 * Avoid an extra # in the URI if we are navigating to the
 * defaultKind.
 */
export function hashIfNeeded(kind: NavigableKind) {
  return kind === defaultKind ? "#" : "#" + kind
}

export function currentKind(): NavigableKind {
  const location = useLocation()
  return (location.hash.slice(1) as NavigableKind) || defaultKind
}

export default function isShowingKind(kind: NavigableKind) {
  return kind === currentKind()
}
