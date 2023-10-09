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
