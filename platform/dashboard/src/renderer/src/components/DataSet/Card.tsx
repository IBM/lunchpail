import CardInGallery from "../CardInGallery"

import type DataSetProps from "./Props"
import type { BaseProps } from "../CardInGallery"

import { commonGroups, numAssociatedWorkerPools } from "./common"

import DataSetIcon from "./Icon"

type Props = BaseProps &
  DataSetProps & {
    /** To help with keeping react re-rendering happy */
    numEvents: number
  }

export default function DataSetCard(props: Props) {
  const hasAssignedWorkers = numAssociatedWorkerPools(props) > 0

  const kind = "datasets" as const
  const icon = <DataSetIcon className={hasAssignedWorkers ? "codeflare--active" : ""} />
  const groups = [...commonGroups(props) /*, this.completionRateChart()*/]

  // const footer = <NewPoolButton {...props} />

  return <CardInGallery {...props} kind={kind} icon={icon} groups={groups} />
}
