import None from "@jaas/components/None"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

import { name as workerpoolsName } from "@jaas/resources/workerpools/name"
// import { name as applicationsName } from "@jaas/resources/applications/name"

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

export function numAssociatedApplications(props: NameAndApplications) {
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
  return props.workerpools.length === 0
    ? undefined
    : descriptionGroup(
        `Active ${workerpoolsName}`,
        props.workerpools.length === 0 ? None() : linkToAllDetails("workerpools", props.workerpools),
        props.workerpools.length,
        "The Worker Pools that have been assigned to process tasks from this queue.",
      )
}

export function numAssociatedWorkerPools(props: Props) {
  return props.workerpools.length
}
