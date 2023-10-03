import { Link } from "react-router-dom"
import { Button, Flex } from "@patternfly/react-core"

import { stopPropagation } from "."

import type { Kind } from "../names"
import type { FunctionComponent } from "react"
import type { LocationProps } from "../router/withLocation"
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

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

export function linkToAllApplicationDetails(names: string[]) {
  return <Flex>{names.map((application) => linkToApplicationDetails({ application }))}</Flex>
}

export const linkToDataSetDetails: FunctionComponent<Pick<Entity, "id">> = ({ id }) => {
  return linkToDetails({ id, kind: "datasets" })
}

export function linkToAllDataSetDetails(names: string[]) {
  return <Flex>{names.map((id) => linkToDataSetDetails({ id }))}</Flex>
}

export const linkToWorkerPoolDetails: FunctionComponent<Pick<Entity, "id">> = ({ id }) => {
  return linkToDetails({ id, kind: "workerpools" })
}
