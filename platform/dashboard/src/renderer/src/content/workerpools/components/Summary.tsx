import type { ReactNode } from "react"
import { Text, type CardHeaderActionsObject } from "@patternfly/react-core"

import Sparkline from "@jaas/components/Sparkline"
import InboxOutboxTable from "@jaas/components/Grid/InboxOutboxTable"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"
import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import { name as runsName } from "@jaas/resources/runs/name"
import { singular as workerpool } from "@jaas/resources/workerpools/name"

import type Props from "./Props"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

function completionRate(events: Props["model"]["events"]) {
  return <Sparkline data={completionRateHistory(events)} />
}

function associatedRuns(workerpool: WorkerPoolStatusEvent) {
  return [workerpool.spec.run]
}

export function gridCellsGroup(inbox: number[], processing: number[], outbox: number[]) {
  const nComplete = outbox.reduce((N, value) => N + value, 0)
  return descriptionGroup(
    "Assigned Tasks (by Worker)",
    <InboxOutboxTable rowLabelPrefix="W" inbox={inbox} processing={processing} outbox={outbox} />,
    `${nComplete} completed by this ${workerpool}`,
    <>
      This view provides a breakdown of the state of <strong>Tasks</strong> that have been assigned to this{" "}
      <strong>{workerpool}</strong>. Each <strong>W1</strong>, <strong>W2</strong>, &hellip; shows the{" "}
      <strong>Tasks</strong> assigned to a particular <strong>Worker</strong>.
    </>,
    "Assigned Tasks",
  )
}

/** "FooBar" -> "Foo Bar" */
export function titleCaseSplit(str: string) {
  return str.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/).join(" ")
}

export function statusActions(
  workerpool: undefined | WorkerPoolStatusEvent,
  textComponent?: import("@patternfly/react-core").TextProps["component"],
): CardHeaderActionsObject & { actions: [] | [ReactNode] } {
  const status = workerpool?.metadata.annotations["codeflare.dev/status"] || "Unknown"

  return {
    hasNoOffset: true,
    actions: !workerpool
      ? []
      : [
          <Text key="status" component={textComponent}>
            {titleCaseSplit(status)}
          </Text>,
        ],
  }
}

export function summaryGroups(
  workerpool: undefined | WorkerPoolStatusEvent,
  events: Props["model"]["events"],
  inbox: number[],
  processing: number[],
  outbox: number[],
  statusOnly = false,
) {
  const runs = workerpool ? associatedRuns(workerpool) : undefined

  return [
    statusOnly && gridCellsGroup(inbox, processing, outbox),
    !statusOnly && runs && descriptionGroup(runsName, linkToAllDetails("runs", runs)),
    events.length > 1 &&
      descriptionGroup("Completion Rate", completionRate(events), meanCompletionRate(events) || "None"),
    !statusOnly && gridCellsGroup(inbox, processing, outbox),
  ]
}
