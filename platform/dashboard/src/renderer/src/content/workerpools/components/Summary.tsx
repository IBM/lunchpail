import type { ReactNode } from "react"
import { Text, type CardHeaderActionsObject } from "@patternfly/react-core"

import Sparkline from "@jaas/components/Sparkline"
import GridRow from "@jaas/components/Grid/Row"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"
import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import { name as runsName } from "@jaas/resources/runs/name"

import type Props from "./Props"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

function completionRate(events: Props["model"]["events"]) {
  return <Sparkline data={completionRateHistory(events)} />
}

function latestRuns(workerpool: WorkerPoolStatusEvent) {
  return [workerpool.spec.run.name]
}

/** One row per worker, within row, one cell per inbox or outbox enqueued task */
function enqueued(inbox: number[]) {
  return (
    <div className="codeflare--workqueues">
      {inbox.map((inbox, i) => (
        <GridRow key={i} queueNum={i + 1} inbox={inbox} kind="pending" />
      ))}
    </div>
  )
}

export function enqueuedGroup(inbox: number[]) {
  return descriptionGroup("Tasks assigned to each worker in this pool", enqueued(inbox))
}

function numProcessing(processing?: number[]) {
  return (processing || []).reduce(
    (N: number, processing) => N + Object.values(processing).reduce((M, size) => M + size, 0),
    0,
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
  statusOnly = false,
) {
  const runs = workerpool ? latestRuns(workerpool) : undefined

  return [
    statusOnly && enqueuedGroup(inbox),
    !statusOnly && runs && descriptionGroup(runsName, linkToAllDetails("runs", runs)),
    descriptionGroup("Tasks Currently Processing", numProcessing(processing)),
    events.length > 1 &&
      descriptionGroup("Completion Rate", completionRate(events), meanCompletionRate(events) || "None"),
    !statusOnly && enqueuedGroup(inbox),
  ]
}
