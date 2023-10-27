import None from "../None"
import Queue from "../Queue"
import names from "../../names"
import { descriptionGroup } from "../DescriptionGroup"

import { LinkToNewPool } from "../../navigate/newpool"
import { linkToAllApplicationDetails, linkToAllWorkerPoolDetails } from "../../navigate/details"

import type { ReactNode } from "react"
import type { GridTypeData } from "../GridCell"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import type Props from "./Props"
type JustEvents = Pick<Props, "events">
type NameAndApplications = Pick<Props, "name" | "applications">
type NameEventsDataSetIndex = JustEvents & Pick<Props, "name" | "datasetIndex">

export function lastEvent(props: JustEvents) {
  return props.events.length === 0 ? null : props.events[props.events.length - 1]
}

function associatedApplicationsFilter(props: NameAndApplications, app: ApplicationSpecEvent) {
  const { name } = props
  if (app.spec.inputs) {
    const { xs, sm, md, lg, xl } = app.spec.inputs[0].sizes
    return xs === name || sm === name || md === name || lg === name || xl === name
  }
  return null
}

function numAssociatedApplicationEvents(props: NameAndApplications) {
  return props.applications.reduce((N, app) => (associatedApplicationsFilter(props, app) ? N + 1 : N), 0)
}

function associatedApplicationEvents(props: NameAndApplications) {
  return props.applications.filter((app) => associatedApplicationsFilter(props, app))
}

function associatedApplications(props: Props) {
  const apps = associatedApplicationEvents(props)
  return descriptionGroup(
    `Compatible ${names.applications}`,
    apps.length === 0 ? None() : linkToAllApplicationDetails(apps),
    apps.length,
    "The Applications that are capable of processing tasks from this queue.",
  )
}

function associatedWorkerPools(props: Props) {
  return descriptionGroup(
    `Active ${names.workerpools}`,
    props.workerpools.length === 0 ? None() : linkToAllWorkerPoolDetails(props.workerpools),
    props.workerpools.length,
    "The Worker Pools that have been assigned to process tasks from this queue.",
  )
}

export function numAssociatedWorkerPools(props: Props) {
  return props.workerpools.length
}

function inboxCount(props: JustEvents) {
  const last = lastEvent(props)
  return last ? parseInt(last.metadata.annotations["codeflare.dev/unassigned"], 10) : 0
}

function cells(count: number, gridDataType: GridTypeData, props: NameEventsDataSetIndex) {
  if (!count) {
    return <Queue inbox={{ [props.name]: 0 }} datasetIndex={props.datasetIndex} gridTypeData="placeholder" />
  }
  return (
    <Queue inbox={{ [props.name]: inboxCount(props) }} datasetIndex={props.datasetIndex} gridTypeData={gridDataType} />
  )
}

function unassigned(props: NameEventsDataSetIndex) {
  const count = inboxCount(props)
  return descriptionGroup("Tasks", count === 0 ? None() : cells(count, "unassigned", props), count)
}

export function commonGroups(props: Props): ReactNode[] {
  return [associatedApplications(props), associatedWorkerPools(props), unassigned(props)]
}

export function NewPoolButton(props: Props) {
  return (
    numAssociatedApplicationEvents(props) > 0 && (
      <LinkToNewPool
        key="new-pool-button"
        dataset={props.name}
        startOrAdd={numAssociatedWorkerPools(props) > 0 ? "add" : "start"}
      />
    )
  )
}
