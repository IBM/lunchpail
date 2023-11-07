import type { DetailableKind } from "../content"

export type DrawerState = {
  /** Selected id currently shown in Drawer */
  id: string

  /** Selected kind currently shown in Drawer */
  kind: DetailableKind
}

export type DrilldownProps = {
  /* id of current selection */
  currentlySelectedId: DrawerState["id"] | null

  /* kind of current selection */
  currentlySelectedKind: DrawerState["kind"] | null

  /**
   * Set the drawer to open, unless the current drawerSelection
   * matches the given id, then set to closed.
   */
  showDetails(props: DrawerState): void
}
