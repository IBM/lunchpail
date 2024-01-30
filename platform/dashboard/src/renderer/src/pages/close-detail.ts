import type { DetailableKind } from "../content"
import { currentlySelectedId, currentlySelectedKind, currentlySelectedContext } from "./current-detail"

export default function closeDetailViewIfShowing(
  id: string,
  context: string,
  kind: DetailableKind,
  returnHome: () => void,
  searchParams = new URLSearchParams(window.location.search),
) {
  if (
    currentlySelectedId(searchParams) === id &&
    currentlySelectedKind(searchParams) === kind &&
    currentlySelectedContext(searchParams) === context
  ) {
    returnHome()
  }
}
