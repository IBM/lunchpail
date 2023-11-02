import { useContext } from "react"

import Sparkline from "../Sparkline"
import Settings from "../../Settings"
import DrawerContent from "../Drawer/Content"
import TaskSimulatorButton from "./TaskSimulatorButton"
import DeleteResourceButton from "../DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"
import { NewPoolButton, lastEvent, commonGroups } from "./common"

import type Props from "./Props"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"

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
    history.length === 0 ? <></> : <Sparkline data={history} taskqueueIdx={props.idx} />,
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

/** Delete this taskqueue */
function deleteAction(last: null | TaskQueueEvent) {
  return !last
    ? []
    : [
        <DeleteResourceButton
          key="delete"
          kind="dataset"
          uiKind="taskqueues"
          name={last.metadata.name}
          namespace={last.metadata.namespace}
        />,
      ]
}

/** Launch a TaskSimulator for this taskqueue */
function taskSimulatorAction(inDemoMode: boolean, last: null | TaskQueueEvent, props: Props) {
  // don't show task simulator button when in demo mode
  return !last || inDemoMode
    ? []
    : [
        <TaskSimulatorButton
          key="task-simulator"
          name={props.name}
          event={last}
          applications={props.applications}
          tasksimulators={props.tasksimulators}
        />,
      ]
}

/** Right-aligned actions */
function rightActions(inDemoMode: boolean, props: Props) {
  const last = lastEvent(props)
  return [...taskSimulatorAction(inDemoMode, last, props), ...deleteAction(last)]
}

/** Left-aligned actions */
function leftActions(props: Props) {
  return [<NewPoolButton key="new-pool" {...props} />]
}

function TaskQueueDetail(props: Props) {
  const settings = useContext(Settings)
  const inDemoMode = settings?.demoMode[0] ?? false

  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props && lastEvent(props)}
      actions={props && leftActions(props)}
      rightActions={props && rightActions(inDemoMode, props)}
    />
  )
}

export default function MaybeTaskQueueDetail(props?: Props) {
  return props && <TaskQueueDetail {...props} />
}
