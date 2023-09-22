import { PureComponent } from "react"
import type { ReactNode } from "react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from "@patternfly/react-core"

import type { CardHeaderActionsObject } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"

import YesIcon from "@patternfly/react-icons//dist/esm/icons/check-icon"
import NoIcon from "@patternfly/react-icons//dist/esm/icons/minus-icon"
import { DrawerCtx, DrawerState } from "../context/DrawerContext"

import "./CardInGallery.scss"

type BaseProps = unknown

export default abstract class CardInGallery<Props extends BaseProps> extends PureComponent<Props> {
  private booleanUI(value: boolean) {
    return value ? <YesIcon /> : <NoIcon />
  }

  protected descriptionGroup(term: ReactNode, description: ReactNode, count?: number | string) {
    return (
      <DescriptionListGroup key={String(term)}>
        <DescriptionListTerm>
          <SmallLabel count={count}>{term}</SmallLabel>
        </DescriptionListTerm>
        <DescriptionListDescription>
          {description === true || description === false ? this.booleanUI(description) : description}
        </DescriptionListDescription>
      </DescriptionListGroup>
    )
  }

  protected abstract label(): string

  protected abstract icon(): ReactNode

  protected abstract groups(): ReactNode[]

  protected actions(): undefined | CardHeaderActionsObject {
    return undefined
  }

  private card(drawerCtxVal: DrawerState) {
    return (
      <Card isClickable isSelectable onClick={drawerCtxVal.toggleExpanded}>
        <CardHeader actions={this.actions()} className="codeflare--card-header-no-wrap">
          <span className="codeflare--card-icon">{this.icon()}</span>
        </CardHeader>
        <CardTitle>{this.label()}</CardTitle>
        <CardBody>
          <DescriptionList isCompact>{this.groups()}</DescriptionList>
        </CardBody>
      </Card>
    )
  }

  public override render() {
    return <DrawerCtx.Consumer>{(drawerCtxVal) => drawerCtxVal && this.card(drawerCtxVal)}</DrawerCtx.Consumer>
  }
}
