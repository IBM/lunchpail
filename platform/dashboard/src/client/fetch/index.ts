import type DataSetModel from "../components/DataSetModel"
import type WorkerPoolModel from "../components/WorkerPoolModel"

interface Fetcher {
  datasets(): Promise<DataSetModel[]> | DataSetModel[]
  workerpools(): Promise<WorkerPoolModel[]> | WorkerPoolModel[]
}

export default Fetcher
