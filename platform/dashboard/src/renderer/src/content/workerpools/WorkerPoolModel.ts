/** For each Worker in a WorkerPool, the number of enqueued Tasks */
type TasksAcrossWorkers = number[]

export interface WorkerPoolModel {
  inbox: TasksAcrossWorkers
  outbox: TasksAcrossWorkers
  processing: TasksAcrossWorkers
  label: string

  /** Namespace in which this model is stored */
  namespace: string

  /** Run to which this pool is assigned */
  run: string

  /** The cluster in which this resources resides */
  context: string
}

export type WorkerPoolModelWithHistory = WorkerPoolModel & {
  numEvents: number
  events: { outbox: number; timestamp: number }[]
}
