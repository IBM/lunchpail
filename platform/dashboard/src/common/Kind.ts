/** Valid resource types. TODO share this with renderer */
const kinds = ["datasets", "queues", "workerpools", "applications", "platformreposecrets"] as const

/** Valid resource types */
type Kind = (typeof kinds)[number]

export default Kind
