import type { DetailableKind } from "../content"
import { currentlySelectedId, currentlySelectedKind } from "./current-detail"

export default function closeDetailViewIfShowing(
  id: string,
  kind: DetailableKind,
  returnHome: () => void,
  searchParams = new URLSearchParams(window.location.search),
) {
  if (currentlySelectedId(searchParams) === id && currentlySelectedKind(searchParams) === kind) {
    returnHome()
  }
}
