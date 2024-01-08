import type { ReactNode } from "react"

import type Memos from "./memos"
import type { Kind } from "./providers"
import type ManagedEvents from "./ManagedEvent"
import type { CurrentSettings } from "../Settings"

/**
 * Governs how to render a certain `Kind` of resource, e.g. Applications
 */
export default interface ContentProvider<K extends Kind = Kind> {
  /** Kind of this resource */
  kind: K

  /** Plural name of this resource */
  name: string

  /** Singular name of this resource */
  singular: string

  /** Optionally, a Title to display in banners; defaults to `name` */
  title?: string

  /** Subtitle when showing a gallery of this kind of resource */
  description: ReactNode

  /** Show this kind of resource in the Sidebar? If `true`, show at the top level; otherwise, show in the given group */
  isInSidebar?: true | string

  /** If we are showing in the Sidebar, what is our sort priority? (higher will float upwards in the sidebar) */
  sidebarPriority?: number

  /** Content to display in the gallery view -- usually a CardInGallery[] */
  gallery?(events: ManagedEvents, memos: Memos, settings: CurrentSettings): ReactNode

  /** Content to display in the detail view */
  detail(
    id: string,
    events: ManagedEvents,
    memos: Memos,
    settings: CurrentSettings,
  ): undefined | { subtitle?: string; body: ReactNode }

  /** Action buttons to show alongside (usually above) the gallery */
  actions?(settings: { inDemoMode: boolean }): ReactNode

  /** Content to show in the popup modal */
  wizard?(events: ManagedEvents): ReactNode
}
