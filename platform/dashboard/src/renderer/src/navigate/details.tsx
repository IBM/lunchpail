import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import { stopPropagation } from "."

import type Kind from "../Kind"
import type { FunctionComponent } from "react"
import type { LocationProps } from "../router/withLocation"
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"
import type WorkerPoolStatusEvent from "../events/WorkerPoolStatusEvent"

type Entity = { id: string; kind: Kind }

function href({ id, kind }: Entity, props: string | Pick<LocationProps, "location">) {
  return `?id=${id}&kind=${kind}&view=detail${typeof props === "string" ? props : props.location.hash}`
}

export function isShowingDetails(props: Pick<LocationProps, "searchParams">) {
  return props.searchParams.get("view") === "detail"
}

export function navigateToDetails(entity: Entity, props: Pick<LocationProps, "navigate" | "location">) {
  props.navigate(href(entity, props))
}

export function routerToDetails(props: { "data-id": string; "data-kind": string; "data-hash": string }) {
  const id = props["data-id"]
  const kind = props["data-kind"] as Kind
  const hash = props["data-hash"]

  return (
    <Link {...props} to={href({ id, kind }, hash)}>
      {id}
    </Link>
  )
}

const linkToDetails: FunctionComponent<Entity> = ({ id, kind }) => {
  const location = window.location // FIXME: useLocation()

  return (
    <Button
      key={id}
      isInline
      variant="link"
      onClick={stopPropagation}
      data-id={id}
      data-kind={kind}
      data-hash={location.hash}
      component={routerToDetails}
    />
  )
}

export const linkToApplicationDetails: FunctionComponent<Pick<ApplicationSpecEvent, "application">> = ({
  application: id,
}) => {
  return linkToDetails({ id, kind: "applications" })
}

export function linkToAllApplicationDetails(applications: ApplicationSpecEvent[] | string[]) {
  return applications.map((application) =>
    linkToApplicationDetails(typeof application === "string" ? { application } : application),
  )
}

export const linkToDataSetDetails: FunctionComponent<Pick<Entity, "id">> = ({ id }) => {
  return linkToDetails({ id, kind: "datasets" })
}

export function linkToAllDataSetDetails(names: string[]) {
  return names.map((id) => linkToDataSetDetails({ id }))
}

export const linkToWorkerPoolDetails: FunctionComponent<Pick<Entity, "id">> = ({ id }) => {
  return linkToDetails({ id, kind: "workerpools" })
}

export function linkToAllWorkerPoolDetails(pools: WorkerPoolStatusEvent[]) {
  return pools.map((pool) => linkToWorkerPoolDetails({ id: pool.workerpool }))
}
