import type DataSetModel from "../DataSetModel"
import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "../../events/WorkerPoolStatusEvent"

type Props = Pick<DataSetModel, "idx" | "label"> & {
  events: DataSetModel[]

  /** Latest set of Applications */
  applications: ApplicationSpecEvent[]

  /** Latest set of WorkerPools aimed at processing this DataSet */
  workerpools: WorkerPoolStatusEvent[]

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>
}

export default Props
