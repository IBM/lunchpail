/** Application-level Resources. Order these as you want them to show up in the Sidebar. */
export const resourceKinds = ["datasets", "workerpools", "applications"] as const

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

/** Resources that will appear in the Nav UI */
export type NavigableKind = NamedKind | NonResourceKind

/** Not displayed in the UI */
const otherKinds = ["queues", "tasksimulators"] as const

/** Not displayed in the UI */
export type OtherKind = (typeof otherKinds)[number]

/** All resources, including those tracked by not directly appearing in the UI */
export const kinds = [...namedKinds, ...otherKinds] as const

/** All resources, including those tracked by not directly appearing in the UI */
type Kind = (typeof kinds)[number]

export default Kind

export function isNavigableKind(kind: NamedKind | OtherKind): kind is NamedKind {
  return namedKinds.includes(kind as NamedKind)
}
