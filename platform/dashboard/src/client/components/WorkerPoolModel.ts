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

/**
 * An update as to the depth of a queue
 */
export default interface QueueEvent {
  /** Millis since epoch */
  timestamp: number

  /** Run that this queue is part of */
  run: string

  /** Name of WorkerPool that this queue is part of */
  workerpool: string

  /** Index of this worker in this WorkerPool */
  workerIndex: number

  /** Name of DataSet that this queue is helping to process */
  dataset: string

  /** Queue depth of the inbox */
  inbox: number

  /** Number of completed tasks by this worker */
  outbox: number

  /** Number of in-process tasks by this worker */
  processing: number
}

/**
 * An update as to the status of a WorkerPool
 */
export interface WorkerPoolStatusEvent {
  /** Millis since epoch */
  timestamp: number

  /** Name of WorkerPool */
  workerpool: string

  /** Machine type */
  nodeClass: string

  /** Does this pool support GPU tasks? */
  supportsGpu: boolean

  /** Age of pool */
  age: string

  /** Status of pool */
  status: string

  /** Ready worker count of pool */
  ready: number

  /** Current worker count of pool */
  size: number
}
