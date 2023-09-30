import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import type { MouseEvent } from "react"
import type { LocationProps } from "../router/withLocation"
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

type Entity = { id: string; kind: string }

export function navigateToHome(props: Pick<LocationProps, "location" | "navigate">) {
  props.navigate(props.location.pathname) // TODO search? state?
}

function hrefToDetails({ id, kind }: Entity) {
  return `?id=${id}&kind=${kind}#detail`
}

export function navigateToDetails(entity: Entity, props: Pick<LocationProps, "navigate">) {
  props.navigate(hrefToDetails(entity))
}

function stopPropagation(evt: MouseEvent<HTMLElement>) {
  evt.stopPropagation()
}

export function routerToDetails(props: { "data-id": string; "data-kind": string }) {
  const id = props["data-id"]
  const kind = props["data-kind"]
  return (
    <Link {...props} to={hrefToDetails({ id, kind })}>
      {id}
    </Link>
  )
}

export function linkToDetails(id: string, kind: string) {
  return (
    <Button
      key={id}
      isInline
      variant="link"
      onClick={stopPropagation}
      data-id={id}
      data-kind={kind}
      component={routerToDetails}
    />
  )
}

export function linkToApplicationDetails({ application }: ApplicationSpecEvent) {
  return linkToDetails(application, "Application")
}

export function linkToDataSetDetails(id: string) {
  return linkToDetails(id, "DataSet")
}

export function linkToWorkerPoolDetails(id: string) {
  return linkToDetails(id, "WorkerPool")
}
