import type { ReactNode } from "react"

import type Memos from "./memos"
import type ManagedEvents from "./ManagedEvent"

/**
 * Governs how to render a certain kind of resource, e.g. Applications
 */
type ContentProvider = {
  /** Plural name of this resource */
  name: string

  /** Singular name of this resource */
  singular: string

  /** Subtitle when showing a gallery of this kind of resource */
  description: ReactNode

  gallery?(events: ManagedEvents, memos: Memos): ReactNode
  detail?(id: string, events: ManagedEvents, memos: Memos): undefined | ReactNode
  actions?(settings: { inDemoMode: boolean }): ReactNode
  wizard?(events: ManagedEvents): ReactNode
}

export default ContentProvider
