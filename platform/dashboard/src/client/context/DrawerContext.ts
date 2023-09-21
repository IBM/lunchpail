import { createContext } from "react"

export type DrawerState = {
  /** Bit that controls opening/closing a drawer when card is clicked/close button clicked */
  isDrawerExpanded: boolean

  /** handles changing the state in Dashboard.tsx regarding opening/closing the drawer */
  toggleExpanded: () => void
}

export const initialState: DrawerState = {
  isDrawerExpanded: false,

  toggleExpanded: () => {},
}

export const DrawerCtx = createContext<DrawerState>(initialState)
