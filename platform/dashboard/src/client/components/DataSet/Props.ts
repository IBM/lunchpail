import type DataSetModel from "../DataSetModel"
import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

type Props = Pick<DataSetModel, "idx" | "label"> & {
  events: DataSetModel[]

  /** Latest set of Application s*/
  applications: ApplicationSpecEvent[]

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>
}

export default Props
