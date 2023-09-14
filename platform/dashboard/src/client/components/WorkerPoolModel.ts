/** Map from DataSet label to number of tasks to be done for that DataSet */
export type DataSetTask = Record<string, number>

/** One DataSetTask for each Worker in a WorkerPool */
type TasksAcrossWorkers = DataSetTask[]

export interface WorkerPoolModel {
  inbox: TasksAcrossWorkers
  outbox: TasksAcrossWorkers
  processing: TasksAcrossWorkers
  label: string
}

/**
 * Temporal history of queue depths
 */
export type QueueHistory = {
  /** History of number of completed tasks */
  outboxHistory: number[]

  /** Timestamps, parallel to the `outboxHistory` array */
  timestamps: number[]
}

export type WorkerPoolModelWithHistory = WorkerPoolModel & QueueHistory
