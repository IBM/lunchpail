/** Map from DataSet label to number of tasks to be done for that DataSet */
export type DataSetTask = Record<string, number>

/** One DataSetTask for each Worker in a WorkerPool */
type TasksAcrossWorkers = DataSetTask[]

interface WorkerPoolModel {
  inbox: TasksAcrossWorkers
  outbox: TasksAcrossWorkers
  processing: TasksAcrossWorkers
  label: string
}

export default WorkerPoolModel
