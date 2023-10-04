import None from "../None"
import Queue from "../Queue"
import names from "../../names"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToAllApplicationDetails, linkToAllWorkerPoolDetails } from "../../navigate/details"

import type { ReactNode } from "react"
import type { GridTypeData } from "../GridCell"

import type Props from "./Props"
type JustEvents = Pick<Props, "events">
type LabelAndApplications = Pick<Props, "label" | "applications">
type LabelEventsDataSetIndex = JustEvents & Pick<Props, "label" | "datasetIndex">

export function lastEvent(props: JustEvents) {
  return props.events.length === 0 ? null : props.events[props.events.length - 1]
}

export function associatedApplicationEvents(props: LabelAndApplications) {
  const { label } = props

  return props.applications.filter((app) => {
    if (app["data sets"]) {
      const { xs, sm, md, lg, xl } = app["data sets"]
      return xs === label || sm === label || md === label || lg === label || xl === label
    }
  })
}

function associatedApplications(props: Props) {
  const apps = associatedApplicationEvents(props)
  return descriptionGroup(
    `Compatible ${names.applications}`,
    apps.length === 0 ? None() : linkToAllApplicationDetails(apps),
    undefined,
    "The Applications that are capable of processing tasks from this queue.",
  )
}

function associatedWorkerPools(props: Props) {
  return descriptionGroup(
    `Active ${names.workerpools}`,
    props.workerpools.length === 0 ? None() : linkToAllWorkerPoolDetails(props.workerpools),
    undefined,
    "The Worker Pools that have been assigned to process tasks from this queue.",
  )
}

function inboxCount(props: JustEvents) {
  const last = lastEvent(props)
  return last ? last.inbox : 0
}

function cells(count: number, gridDataType: GridTypeData, props: LabelEventsDataSetIndex) {
  if (!count) {
    return <Queue inbox={{ [props.label]: 0 }} datasetIndex={props.datasetIndex} gridTypeData="placeholder" />
  }
  return (
    <Queue inbox={{ [props.label]: inboxCount(props) }} datasetIndex={props.datasetIndex} gridTypeData={gridDataType} />
  )
}

function unassigned(props: LabelEventsDataSetIndex) {
  const count = inboxCount(props)
  return descriptionGroup("Tasks", cells(count, "unassigned", props), count)
}

export function commonGroups(props: Props): ReactNode[] {
  return [associatedApplications(props), associatedWorkerPools(props), unassigned(props)]
}
