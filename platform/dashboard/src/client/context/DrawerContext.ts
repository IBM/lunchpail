import type { ReactNode } from "react"

export type DrawerState = {
  /** Selected id currently shown in Drawer */
  id: string

  /** Title to display in the drawer */
  title(): ReactNode

  /** Body to display in the drawer */
  body(): ReactNode
}

export type DrilldownProps = {
  /* id of current selection */
  currentSelection?: string

  /**
   * Set the drawer to open, unless the current drawerSelection
   * matches the given id, then set to closed.
   */
  showDetails(props: DrawerState): void
}
