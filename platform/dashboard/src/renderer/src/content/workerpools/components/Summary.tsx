import type { ReactNode } from "react"
import { Text, type CardHeaderActionsObject } from "@patternfly/react-core"

import Sparkline from "@jaas/components/Sparkline"
import GridRow from "@jaas/components/Grid/Row"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"
import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import { name as applicationsName } from "@jaas/resources/applications/name"

import type Props from "./Props"

function completionRate(props: Props) {
  return <Sparkline data={completionRateHistory(props.model.events)} />
}

function latestApplications(props: Props) {
  if (props.status) {
    return [props.status.spec.application.name]
  }
  return null
}

/** One row per worker, within row, one cell per inbox or outbox enqueued task */
function enqueued(props: Props) {
  return (
    <div className="codeflare--workqueues">
      {props.model.inbox.map((inbox, i) => (
        <GridRow key={i} queueNum={i + 1} inbox={inbox} taskqueueIndex={props.taskqueueIndex} />
      ))}
    </div>
  )
}

export function enqueuedGroup(props: Props) {
  return descriptionGroup("Tasks assigned to each worker in this pool", enqueued(props))
}

function numProcessing(props: Props) {
  return (props.model.processing || []).reduce(
    (N: number, processing) => N + Object.values(processing).reduce((M, size) => M + size, 0),
    0,
  )
}

/** "FooBar" -> "Foo Bar" */
export function titleCaseSplit(str: string) {
  return str.split(/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/).join(" ")
}

export function statusActions(
  props: Props,
  textComponent?: import("@patternfly/react-core").TextProps["component"],
): CardHeaderActionsObject & { actions: [] | [ReactNode] } {
  const latestStatus = props.status
  const status = latestStatus?.metadata.annotations["codeflare.dev/status"] || "Unknown"

  return {
    hasNoOffset: true,
    actions: !latestStatus
      ? []
      : [
          <Text key="status" component={textComponent}>
            {titleCaseSplit(status)}
          </Text>,
        ],
  }
}

export function summaryGroups(props: Props, statusOnly = false) {
  const applications = latestApplications(props)

  return [
    statusOnly && enqueuedGroup(props),
    !statusOnly && applications && descriptionGroup(applicationsName, linkToAllDetails("applications", applications)),
    // descriptionGroup("Number of Workers", count(props)),
    descriptionGroup("Tasks Currently Processing", numProcessing(props)),
    props.model.events.length > 1 &&
      descriptionGroup("Completion Rate", completionRate(props), meanCompletionRate(props.model.events) || "None"),
    !statusOnly && enqueuedGroup(props),
  ]
}
