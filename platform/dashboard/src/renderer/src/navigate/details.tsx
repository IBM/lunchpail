import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import { stopPropagation } from "."

import { type DetailableKind as Kind } from "../content/providers"
import type { FunctionComponent } from "react"
import type LocationProps from "./LocationProps"
import type KubernetesResource from "@jay/common/events/KubernetesResource"

export type Entity = { id: string; kind: Kind }

export function href({ id, kind }: Entity, props: string | Pick<LocationProps, "location">) {
  return `?id=${id}&kind=${kind}&view=detail${typeof props === "string" ? props : props.location.hash}`
}

export function isShowingDetails(searchParams: URLSearchParams) {
  return searchParams.get("view") === "detail"
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
      ouiaId={id}
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

export function linkToAllDetails(kind: Kind, resources: KubernetesResource[] | string[]) {
  return resources.map((rsrc) =>
    linkToDetails(typeof rsrc === "string" ? { id: rsrc, kind } : { id: rsrc.metadata.name, kind }),
  )
}
