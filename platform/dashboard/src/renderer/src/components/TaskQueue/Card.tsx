import CardInGallery from "../CardInGallery"

import type TaskQueueProps from "./Props"

import TaskSimulatorButton from "./TaskSimulatorButton"
import { commonGroups, lastEvent, numAssociatedWorkerPools } from "./common"

import TaskQueueIcon from "./Icon"

type Props = TaskQueueProps & {
  /** To help with keeping react re-rendering happy */
  numEvents: number
}

export default function TaskQueueCard(props: Props) {
  const hasAssignedWorkers = numAssociatedWorkerPools(props) > 0

  const icon = <TaskQueueIcon className={hasAssignedWorkers ? "codeflare--active" : ""} />
  const groups = [...commonGroups(props) /*, this.completionRateChart()*/]

  const last = lastEvent(props)
  const actions = !last
    ? undefined
    : {
        hasNoOffset: true,
        actions: <TaskSimulatorButton event={last} simulators={props.tasksimulators} invisibleIfNoSimulators />,
      }

  return <CardInGallery kind="taskqueues" name={props.name} icon={icon} groups={groups} actions={actions} />
}
