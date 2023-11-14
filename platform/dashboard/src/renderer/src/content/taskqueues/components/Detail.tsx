import { singular } from "../name"
import Sparkline from "@jay/components/Sparkline"
import { BrowserTabs } from "@jay/components/S3Browser"
import DrawerContent from "@jay/components/Drawer/Content"
import TaskSimulatorButton from "./TaskSimulatorButton"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"
import { NewPoolButton, lastEvent, unassigned, workerpools } from "./common"

import type Props from "./Props"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"

function bucket(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Bucket", last ? last.spec.local.bucket : "unknown")
}

function inboxHistory(props: Props) {
  return props.events.map((_) =>
    !_.metadata.annotations["codeflare.dev/unassigned"]
      ? 0
      : parseInt(_.metadata.annotations["codeflare.dev/unassigned"], 10),
  )
}

function unassignedChart(props: Props) {
  const history = inboxHistory(props)

  return history.length <= 1
    ? []
    : [
        descriptionGroup(
          "Unassigned Tasks over Time",
          history.length === 0 ? <></> : <Sparkline data={history} taskqueueIdx={props.idx} />,
        ),
      ]
}

function detailGroups(props: Props, tasksOnly = false) {
  return [
    unassigned(props),
    ...unassignedChart(props),
    ...(tasksOnly ? [] : [workerpools(props), bucket(props)]),
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
          singular={singular}
          name={last.metadata.name}
          namespace={last.metadata.namespace}
        />,
      ]
}

/** Launch a TaskSimulator for this taskqueue */
export function taskSimulatorAction(inDemoMode: boolean, last: null | TaskQueueEvent, props: Props) {
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

/** Tabs specific to this kind of data */
function otherTabs(props: Props) {
  const last = lastEvent(props)
  return !last ? [] : BrowserTabs(last.spec.local)
}

/** Summary tab content */
export function summaryTabContent(props: Props, tasksOnly = false) {
  return <DescriptionList groups={detailGroups(props, tasksOnly)} ouiaId={props.name} />
}

export default function TaskQueueDetail(props: Props) {
  const inDemoMode = props.settings?.demoMode[0] ?? false

  return (
    <DrawerContent
      summary={summaryTabContent(props)}
      raw={lastEvent(props)}
      otherTabs={otherTabs(props)}
      actions={leftActions(props)}
      rightActions={rightActions(inDemoMode, props)}
    />
  )
}
