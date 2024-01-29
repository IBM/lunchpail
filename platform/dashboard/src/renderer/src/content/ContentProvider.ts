import type { ReactElement, ReactNode } from "react"

import type Memos from "./memos"
import type { Kind } from "./providers"
import type ManagedEvents from "./ManagedEvent"
import type { CurrentSettings } from "../Settings"

export type ContentProviderSidebarSpec =
  | true
  | {
      /** Show this kind of resource in the Sidebar? If `true`, show at the top level; otherwise, show in the given group */
      group?: string

      /** If we are showing in the Sidebar, what is our sort priority? (higher will float upwards in the sidebar) */
      priority?: number

      /** Suffix for badge */
      badgeSuffix?: string
    }

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

  /** if `true`, then show at the root of the Sidebar tree, using the default sorting priority (lexicographic) */
  sidebar?: ContentProviderSidebarSpec

  /** Content to display in the gallery view -- usually a CardInGallery[] */
  gallery?(
    events: ManagedEvents,
    memos: Memos,
    settings: CurrentSettings,
  ): ReactElement<import("../components/Gallery").GalleryProps>

  /** Content to display in the detail view */
  detail(
    id: string,
    context: string,
    events: ManagedEvents,
    memos: Memos,
    settings: CurrentSettings,
  ): undefined | { subtitle?: string; body: ReactNode }

  /** Action buttons to show alongside (usually above) the gallery */
  actions?(settings: { inDemoMode: boolean }): ReactNode

  /** Content to show in the popup modal */
  wizard?(events: ManagedEvents): ReactNode
}
