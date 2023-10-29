import CardInGallery from "../CardInGallery"

import type TaskQueueProps from "./Props"
import type { BaseProps } from "../CardInGallery"

import { commonGroups, numAssociatedWorkerPools } from "./common"

import TaskQueueIcon from "./Icon"

type Props = BaseProps &
  TaskQueueProps & {
    /** To help with keeping react re-rendering happy */
    numEvents: number
  }

export default function TaskQueueCard(props: Props) {
  const hasAssignedWorkers = numAssociatedWorkerPools(props) > 0

  const kind = "taskqueues" as const
  const icon = <TaskQueueIcon className={hasAssignedWorkers ? "codeflare--active" : ""} />
  const groups = [...commonGroups(props) /*, this.completionRateChart()*/]

  // const footer = <NewPoolButton {...props} />

  return <CardInGallery {...props} kind={kind} icon={icon} groups={groups} />
}
