/** Resource types that we watch */
const watchedKinds = [
  "taskqueues",
  "queues",
  "workerpools",
  "applications",
  "platformreposecrets",
  "tasksimulators",
] as const

/** Valid resource types */
type WatchedKind = (typeof watchedKinds)[number]

export default WatchedKind
