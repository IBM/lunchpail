import type { DetailableKind } from "../content"

export function currentlySelectedId(searchParams: URLSearchParams) {
  return searchParams.get("id")
}

export function currentlySelectedKind(searchParams: URLSearchParams) {
  return searchParams.get("kind") as DetailableKind
}

export function currentlySelectedContext(searchParams: URLSearchParams) {
  return searchParams.get("context")
}
