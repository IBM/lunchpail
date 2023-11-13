import { Link } from "react-router-dom"
import { Button } from "@patternfly/react-core"

import { stopPropagation } from "."

import type { FunctionComponent } from "react"
import type LocationProps from "./LocationProps"
import { type DetailableKind as Kind } from "../content"
import type KubernetesResource from "@jay/common/events/KubernetesResource"

export type Entity = { id: string; kind: Kind; linkText?: string }

export function href({ id, kind }: Entity, props: string | Pick<LocationProps, "location">) {
  return `?id=${id}&kind=${kind}&view=detail${typeof props === "string" ? props : props.location.hash}`
}

export function isShowingDetails(searchParams: URLSearchParams) {
  return searchParams.get("view") === "detail"
}

export function navigateToDetails(entity: Entity, props: Pick<LocationProps, "navigate" | "location">) {
  props.navigate(href(entity, props))
}

export function routerToDetails(props: {
  "data-id": string
  "data-kind": string
  "data-hash": string
  "data-link-text"?: string
}) {
  const id = props["data-id"]
  const kind = props["data-kind"] as Kind
  const hash = props["data-hash"]
  const linkText = props["data-link-text"] ?? id

  return (
    <Link {...props} to={href({ id, kind }, hash)}>
      {linkText}
    </Link>
  )
}

/** Present a link to show the Details view of the given resource */
const linkToDetails: FunctionComponent<Entity> = ({ id, kind, linkText }) => {
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
      data-link-text={linkText}
      component={routerToDetails}
    />
  )
}

/** Present a list of links to show the Details view of the given resources */
export function linkToAllDetails(kind: Kind, resources: KubernetesResource[] | string[], linkTexts: string[] = []) {
  return resources.map((rsrc, idx) =>
    linkToDetails(
      typeof rsrc === "string"
        ? { id: rsrc, kind, linkText: linkTexts[idx] }
        : { id: rsrc.metadata.name, kind, linkText: linkTexts[idx] },
    ),
  )
}
