import Sparkline from "../Sparkline"
import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import TaskSimulatorButton from "./TaskSimulatorButton"
import { dl, descriptionGroup } from "../DescriptionGroup"
import { NewPoolButton, lastEvent, commonGroups } from "./common"

import type Props from "./Props"
import type DataSetEvent from "@jay/common/events/DataSetEvent"

type DataSetDetailProps = Props

function bucket(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Bucket", last ? last.bucket : "unknown")
}

function storageType(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Storage Type", last ? last.storageType : "unknown")
}

function inboxHistory(props: Props) {
  return props.events.map((_) => _.inbox)
}

function unassignedChart(props: Props) {
  const history = inboxHistory(props)

  return descriptionGroup(
    "Tasks over Time",
    history.length === 0 ? <></> : <Sparkline data={history} datasetIdx={props.idx} />,
  )
}

function detailGroups(props: Props) {
  return [
    storageType(props),
    bucket(props),
    ...commonGroups(props),
    unassignedChart(props),
    // completionRateChart(),
  ]
}

/** Delete this dataset */
function deleteAction(last: null | DataSetEvent) {
  return !last ? [] : [<DeleteButton key="delete" kind="dataset" name={last.label} namespace={last.namespace} />]
}

/** Launch a TaskSimulator for this dataset */
function taskSimulatorAction(last: null | DataSetEvent, props: Props) {
  return !last
    ? []
    : [
        <TaskSimulatorButton
          key="task-simulator"
          name={last.label}
          namespace={last.namespace}
          simulators={props.tasksimulators}
        />,
      ]
}

/** Right-aligned actions */
function rightActions(props: Props) {
  const last = lastEvent(props)
  return [...taskSimulatorAction(last, props), ...deleteAction(last)]
}

/** Left-aligned actions */
function leftActions(props: DataSetDetailProps) {
  return [<NewPoolButton key="new-pool" {...props} />]
}

export default function DataSetDetail(props: DataSetDetailProps | undefined) {
  return (
    <DrawerContent
      body={props && dl(detailGroups(props))}
      actions={props && leftActions(props)}
      rightActions={props && rightActions(props)}
    />
  )
}
