import type { ReactNode } from "react"

import type Kind from "@jay/common/Kind"
import type Memos from "./memos"
import type ManagedEvents from "./ManagedEvent"

/**
 * Governs how to render a certain kind of resource, e.g. Applications
 */
type ContentProvider<K extends Kind | "controlplane" = Kind | "controlplane"> = {
  /** Kind of this resource */
  kind: K

  /** Plural name of this resource */
  name: string

  /** Singular name of this resource */
  singular: string

  /** Subtitle when showing a gallery of this kind of resource */
  description: ReactNode

  /** Show this kind of resource in the Sidebar? If `true`, show at the top level; otherwise, show in the given group */
  isInSidebar?: true | string

  /** Content to display in the gallery view -- usually a CardInGallery[] */
  gallery?(events: ManagedEvents, memos: Memos): ReactNode

  /** Content to display in the detail view */
  detail(id: string, events: ManagedEvents, memos: Memos): undefined | ReactNode

  /** Action buttons to show alongside (usually above) the gallery */
  actions?(settings: { inDemoMode: boolean }): ReactNode

  /** Content to show in the popup modal */
  wizard?(events: ManagedEvents): ReactNode
}

export default ContentProvider
