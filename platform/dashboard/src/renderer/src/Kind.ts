/** Application-level Resources. Order these as you want them to show up in the Sidebar. */
export const resourceKinds = ["applications", "datasets", "taskqueues", "workerpools"] as const

/** Application-level Resources */
export type ResourceKind = (typeof resourceKinds)[number]

/** Secrets-related Resources. Order these as you want them to show up in the Sidebar. */
export const credentialsKinds = ["platformreposecrets"] as const

/** Resources that will appear in the UI */
export type CredentialsKind = (typeof credentialsKinds)[number]

/** Resources that will appear in the UI */
export const namedKinds = [...resourceKinds, ...credentialsKinds] as const

/** Resources that will appear in the UI */
export type NamedKind = (typeof namedKinds)[number]

/** Navigable, but not representing a resource */
const nonResourceKinds = ["controlplane"] as const

/** Navigable, but not representing a resource */
export type NonResourceKind = (typeof nonResourceKinds)[number]

/** Resources that have Detail */
const detailableKinds = [...namedKinds, ...nonResourceKinds]

/** Resources that have Detail */
export type DetailableKind = (typeof detailableKinds)[number]

/** Resources that will appear in the Nav UI */
export type NavigableKind = DetailableKind // Exclude<DetailableKind, "taskqueues">

/** Not displayed in the UI */
const otherKinds = ["queues", "tasksimulators"] as const

/** Not displayed in the UI */
export type OtherKind = (typeof otherKinds)[number]

/** All resources, including those tracked by not directly appearing in the UI */
export const kinds = [...namedKinds, ...otherKinds] as const

/** All resources, including those tracked by not directly appearing in the UI */
type Kind = (typeof kinds)[number]

export default Kind

export function isDetailableKind(kind: DetailableKind | OtherKind): kind is DetailableKind {
  return detailableKinds.includes(kind as DetailableKind)
}
