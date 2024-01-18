import { useCallback } from "react"
import { Card, CardHeader, CardTitle, CardBody, CardFooter, DescriptionListProps } from "@patternfly/react-core"

import drilldownProps from "../pages/DrilldownProps"
import { dl as DescriptionList } from "./DescriptionGroup"

import type { ReactNode } from "react"
import type { NavigableKind as Kind } from "../content"
import type { CardHeaderActionsObject } from "@patternfly/react-core"

import "./CardInGallery.scss"

/** <CardInGallery/> React Component properties */
export type Props = {
  kind: Kind
  name: string
  context: string
  title?: string
  size?: "sm" | "lg"
  icon?: ReactNode
  groups: ReactNode[]
  footer?: ReactNode
  actions?: CardHeaderActionsObject
  descriptionListProps?: DescriptionListProps
}

const defaultDescriptionListProps: DescriptionListProps = {
  isCompact: true,
}

export default function CardInGallery(props: Props) {
  const { showDetails, currentlySelectedId, currentlySelectedKind, currentlySelectedContext } = drilldownProps()
  const onClick = useCallback(
    () => showDetails({ id: props.name, kind: props.kind, context: props.context }),
    [props.name, props.kind, showDetails],
  )

  const header = (
    <CardHeader actions={props.actions} className="codeflare--card-header-no-wrap">
      {props.icon && <span className="codeflare--card-icon">{props.icon}</span>}
      <CardTitle>{props.title ?? props.name}</CardTitle>
    </CardHeader>
  )

  const body = (
    <DescriptionList groups={props.groups} props={props.descriptionListProps ?? defaultDescriptionListProps} />
  )

  return (
    <Card
      isLarge={!props.size || props.size === "lg"}
      isClickable
      isSelectable
      isSelectableRaised
      ouiaId={props.name}
      isSelected={
        currentlySelectedId === props.name &&
        currentlySelectedKind === props.kind &&
        currentlySelectedContext === props.context
      }
      onClick={onClick}
    >
      {header}
      <CardBody>{body}</CardBody>
      {props.footer && <CardFooter>{props.footer}</CardFooter>}
    </Card>
  )
}
