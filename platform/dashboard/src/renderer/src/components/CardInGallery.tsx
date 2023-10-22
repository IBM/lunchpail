import { Card, CardHeader, CardTitle, CardBody, CardFooter, DescriptionListProps } from "@patternfly/react-core"

import type { ReactNode } from "react"
import type { CardHeaderActionsObject } from "@patternfly/react-core"

import type { NavigableKind as Kind } from "../Kind"
import type { DrilldownProps } from "../context/DrawerContext"

import { dl } from "./DescriptionGroup"

import "./CardInGallery.scss"

export type BaseProps = DrilldownProps

type Props = BaseProps & {
  kind: Kind
  label: string
  title?: ReactNode
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
  const onClick = () => props.showDetails({ id: props.label, kind: props.kind })

  const header = props.icon && (
    <CardHeader actions={props.actions} className="codeflare--card-header-no-wrap">
      <span className="codeflare--card-icon">{props.icon}</span>
    </CardHeader>
  )

  const body = dl(props.groups, props.descriptionListProps ?? defaultDescriptionListProps)

  return (
    <Card
      isClickable
      isSelectable
      isSelectableRaised
      isSelected={props.currentlySelectedId === props.label && props.currentlySelectedKind === props.kind}
      onClick={onClick}
    >
      {header}
      <CardTitle>{props.title ?? props.label}</CardTitle>
      <CardBody>{body}</CardBody>
      {props.footer && <CardFooter>{props.footer}</CardFooter>}
    </Card>
  )
}
