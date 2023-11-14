import None from "@jay/components/None"
import Cells from "@jay/components/Grid/Cells"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { linkToAllDetails } from "@jay/renderer/navigate/details"

import { name as workerpoolsName } from "../../workerpools/name"
// import { name as applicationsName } from "../../applications/name"

import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import type Props from "./Props"
type JustEvents = Pick<Props, "events">
type NameAndApplications = Pick<Props, "name" | "applications">

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

function numAssociatedApplications(props: NameAndApplications) {
  return props.applications.reduce((N, app) => (associatedApplicationsFilter(props, app) ? N + 1 : N), 0)
}

export function associatedApplications(props: NameAndApplications) {
  return props.applications.filter((app) => associatedApplicationsFilter(props, app))
}

/* function applications(props: Props) {
  const apps = associatedApplications(props)
  return descriptionGroup(
    `Compatible ${applicationsName}`,
    apps.length === 0 ? None() : linkToAllDetails("applications", apps),
    apps.length,
    "The Applications that are capable of processing tasks from this queue.",
  )
} */

export function workerpools(props: Props) {
  return descriptionGroup(
    `Active ${workerpoolsName}`,
    props.workerpools.length === 0 ? None() : linkToAllDetails("workerpools", props.workerpools),
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

function cells(count: number, props: Props) {
  const taskqueueIndex = { [props.name]: 2 }
  if (!count) {
    return <Cells inbox={{ [props.name]: 0 }} taskqueueIndex={taskqueueIndex} />
  }
  return <Cells inbox={{ [props.name]: inboxCount(props) }} taskqueueIndex={taskqueueIndex} />
}

function storageType(props: Props) {
  const last = lastEvent(props)
  if (last) {
    const storageType = last.spec.local.type
    return storageType === "COS" ? "S3-based queue" : storageType
  } else {
    return undefined
  }
}

export function unassigned(props: Props) {
  const count = inboxCount(props)
  return descriptionGroup(
    "Unassigned Tasks",
    count === 0 ? None() : cells(count, props),
    isNaN(count) ? 0 : count,
    storageType(props),
    "Queue Provider",
  )
}

export function NewPoolButton(props: Props) {
  return (
    numAssociatedApplications(props) > 0 && (
      <LinkToNewPool
        key="new-pool-button"
        taskqueue={props.name}
        startOrAdd={numAssociatedWorkerPools(props) > 0 ? "add" : "start"}
      />
    )
  )
}
