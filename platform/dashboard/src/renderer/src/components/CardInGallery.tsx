import { useCallback } from "react"
import { Card, CardHeader, CardTitle, CardBody, CardFooter, DescriptionListProps } from "@patternfly/react-core"

import drilldownProps from "../pages/DrilldownProps"
import { dl as DescriptionList } from "./DescriptionGroup"

import type { ReactNode } from "react"
import type { NavigableKind as Kind } from "../content"
import type { CardHeaderActionsObject } from "@patternfly/react-core"

import "./CardInGallery.scss"

type Props = {
  kind: Kind
  name: string
  title?: string
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
  const { showDetails, currentlySelectedId, currentlySelectedKind } = drilldownProps()
  const onClick = useCallback(
    () => showDetails({ id: props.name, kind: props.kind }),
    [props.name, props.kind, showDetails],
  )

  const header = props.icon && (
    <CardHeader actions={props.actions} className="codeflare--card-header-no-wrap">
      <span className="codeflare--card-icon">{props.icon}</span>
    </CardHeader>
  )

  const body = (
    <DescriptionList groups={props.groups} props={props.descriptionListProps ?? defaultDescriptionListProps} />
  )

  return (
    <Card
      isLarge
      isClickable
      isSelectable
      isSelectableRaised
      ouiaId={props.name}
      isSelected={currentlySelectedId === props.name && currentlySelectedKind === props.kind}
      onClick={onClick}
    >
      {header}
      <CardTitle>{props.title ?? props.name}</CardTitle>
      <CardBody>{body}</CardBody>
      {props.footer && <CardFooter>{props.footer}</CardFooter>}
    </Card>
  )
}
