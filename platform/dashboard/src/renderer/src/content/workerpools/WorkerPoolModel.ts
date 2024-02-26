export interface WorkerPoolModel {
  /** For each Worker in a WorkerPool, the number of enqueued Tasks */
  inbox: number[]

  /** For each Worker in a WorkerPool, the number of completed Tasks */
  outbox: number[]

  /** For each Worker in a WorkerPool, the number of in-progress Tasks */
  processing: number[]

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
