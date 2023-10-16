import type { NamedKind } from "../Kind"
import type { LocationProps } from "../router/withLocation"

const defaultKind: NamedKind = "datasets"

export function hash(kind: NamedKind) {
  return "#" + kind
}

/**
 * Avoid an extra # in the URI if we are navigating to the
 * defaultKind.
 */
export function hashIfNeeded(kind: NamedKind) {
  return kind === defaultKind ? "#" : "#" + kind
}

export function currentKind(props: Pick<LocationProps, "location">): NamedKind {
  return (props.location.hash.slice(1) as NamedKind) || defaultKind
}

export default function isShowingKind(kind: NamedKind, props: Pick<LocationProps, "location">) {
  return kind === currentKind(props)
}
