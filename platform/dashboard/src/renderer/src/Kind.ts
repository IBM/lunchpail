import type WatchableKind from "@jay/common/Kind"

/** Application-level Resources. Order these as you want them to show up in the Sidebar. */
export const resourceKinds = ["applications", "datasets", "workerpools"] as const

/** Application-level Resources */
export type ResourceKind = (typeof resourceKinds)[number]

/** Resources that have Detail but are excluded from the Sidebar Navigation */
const detailOnlyResourceKinds = ["taskqueues"] as const

/** Resources that have Detail but are excluded from the Sidebar Navigation */
export type DetailOnlyKind = (typeof detailOnlyResourceKinds)[number]

/** Secrets-related Resources. Order these as you want them to show up in the Sidebar. */
export const credentialsKinds = ["platformreposecrets"] as const

/** Resources that will appear in the UI */
export const namedKinds = [...resourceKinds, ...credentialsKinds, ...detailOnlyResourceKinds] as const

/** Navigable, but not representing a resource */
const nonResourceKinds = ["controlplane"] as const

/** Resources that have Detail */
const detailableKinds = [...namedKinds, ...nonResourceKinds]

/** Resources that have Detail */
export type DetailableKind = (typeof detailableKinds)[number]

/** Resources that will appear in the Nav UI */
export type NavigableKind = Exclude<DetailableKind, "taskqueues">

/** All resources, including those tracked by not directly appearing in the UI */
type Kind = WatchableKind | "controlplane"

export default Kind
