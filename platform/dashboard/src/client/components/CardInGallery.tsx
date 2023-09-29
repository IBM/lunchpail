import { PureComponent } from "react"
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from "@patternfly/react-core"

import type { MouseEvent, ReactNode } from "react"
import type { LocationProps } from "../router/withLocation"
import type { CardHeaderActionsObject } from "@patternfly/react-core"

import { dl, descriptionGroup } from "./DescriptionGroup"

import type { DrilldownProps } from "../context/DrawerContext"

import "./CardInGallery.scss"

type BaseProps = DrilldownProps & Pick<LocationProps, "navigate">

export default abstract class CardInGallery<Props> extends PureComponent<Props & BaseProps> {
  protected readonly stopPropagation = (evt: MouseEvent<HTMLElement>) => evt.stopPropagation()

  protected descriptionGroup(
    term: ReactNode,
    description: ReactNode | Record<string, string>,
    count?: number | string,
  ) {
    return descriptionGroup(term, description, count)
  }

  protected kind(): string {
    return this.constructor.name
  }

  protected abstract label(): string

  protected abstract icon(): ReactNode

  /** DescriptionList groups to display in the Card summary */
  protected abstract summaryGroups(): ReactNode[]

  /**
   * DescriptionList groups to display in the drilldown view (e.g. a
   * Drawer UI). This defaults to show this.summaryGroups(), which is
   * probably not what subclasses ultimately want, but helps with
   * prototyping.
   */
  protected detailGroups(): ReactNode[] {
    return this.summaryGroups()
  }

  protected actions(): undefined | CardHeaderActionsObject {
    return undefined
  }

  private readonly onClick = () => {
    this.props.showDetails({ id: this.label(), kind: this.kind() })
  }

  private summaryHeader() {
    return (
      <CardHeader actions={this.actions()} className="codeflare--card-header-no-wrap">
        <span className="codeflare--card-icon">{this.icon()}</span>
      </CardHeader>
    )
  }

  private summaryTitle() {
    return this.label()
  }

  private summaryBody() {
    return dl(this.summaryGroups())
  }

  protected summaryFooter(): null | ReactNode {
    return null
  }

  private card() {
    return (
      <Card
        isLarge
        isClickable
        isSelectable
        isSelectableRaised
        isSelected={this.props.currentlySelectedId === this.label() && this.props.currentlySelectedKind === this.kind()}
        onClick={this.onClick}
      >
        {this.summaryHeader()}
        <CardTitle>{this.summaryTitle()}</CardTitle>
        <CardBody>{this.summaryBody()}</CardBody>
        {this.summaryFooter() && <CardFooter>{this.summaryFooter()}</CardFooter>}
      </Card>
    )
  }

  public override render() {
    return this.card()
  }
}
