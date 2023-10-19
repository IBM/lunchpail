import type { NavigableKind } from "../Kind"
import type { LocationProps } from "../router/withLocation"

const defaultKind: NavigableKind = "welcome"

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

export function currentKind(props: Pick<LocationProps, "location">): NavigableKind {
  return (props.location.hash.slice(1) as NavigableKind) || defaultKind
}

export default function isShowingKind(kind: NavigableKind, props: Pick<LocationProps, "location">) {
  return kind === currentKind(props)
}
