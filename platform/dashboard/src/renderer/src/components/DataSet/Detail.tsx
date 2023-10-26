import { useContext } from "react"

import Sparkline from "../Sparkline"
import Settings from "../../Settings"
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
  return descriptionGroup("Bucket", last ? last.spec.local.bucket : "unknown")
}

function storageType(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Storage Type", last ? last.spec.local.type : "unknown")
}

function inboxHistory(props: Props) {
  return props.events.map((_) => parseInt(_.metadata.annotations["codeflare.dev/unassigned"], 10))
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
  return !last
    ? []
    : [<DeleteButton key="delete" kind="dataset" name={last.metadata.name} namespace={last.metadata.namespace} />]
}

/** Launch a TaskSimulator for this dataset */
function taskSimulatorAction(last: null | DataSetEvent, props: Props) {
  const settings = useContext(Settings)
  const inDemoMode = settings?.demoMode[0]

  // don't show task simulator button when in demo mode
  return !last || inDemoMode
    ? []
    : [
        <TaskSimulatorButton
          key="task-simulator"
          name={last.metadata.name}
          namespace={last.metadata.namespace}
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
