import type { ReactNode } from "react"

import type Memos from "./memos"
import type ManagedEvents from "./ManagedEvent"

type ContentProvider = {
  gallery?(events: ManagedEvents, memos: Memos): ReactNode
  detail?(id: string, events: ManagedEvents, memos: Memos): undefined | ReactNode
  actions?(settings: { inDemoMode: boolean }): ReactNode
  wizard?(events: ManagedEvents): ReactNode
}

export default ContentProvider
