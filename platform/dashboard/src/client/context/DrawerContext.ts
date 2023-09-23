import type { ReactNode } from "react"

export type DrawerState = {
  /** Selected id currently shown in Drawer */
  drawerSelection: string

  /** Title to display in the drawer */
  drawerTitle(): ReactNode

  /** Body to display in the drawer */
  drawerBody(): ReactNode
}

export type DrilldownProps = {
  /* id of current selection */
  currentSelection?: string

  /**
   * Set the drawer to open, unless the current drawerSelection
   * matches the given id, then set to closed.
   */
  showDetails(id: string, title: DrawerState["drawerTitle"], body: DrawerState["drawerBody"]): void
}
