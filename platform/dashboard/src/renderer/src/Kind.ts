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

/** All resources, including those tracked by not directly appearing in the UI */
export const kinds = [...namedKinds, "queues"] as const

/** All resources, including those tracked by not directly appearing in the UI */
type Kind = (typeof kinds)[number]

export default Kind
