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
  Flex,
  FlexItem,
} from "@patternfly/react-core"

import type { CardHeaderActionsObject } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"

import type { DrilldownProps } from "../context/DrawerContext"

import YesIcon from "@patternfly/react-icons//dist/esm/icons/check-icon"
import NoIcon from "@patternfly/react-icons//dist/esm/icons/minus-icon"

import "./CardInGallery.scss"

type BaseProps = DrilldownProps

export default abstract class CardInGallery<Props> extends PureComponent<Props & BaseProps> {
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

  private readonly detailTitle = () => (
    <Flex>
      <FlexItem>{this.icon()}</FlexItem>
      <FlexItem>{this.label()}</FlexItem>
    </Flex>
  )

  private readonly detailBody = () => <DescriptionList>{this.detailGroups()}</DescriptionList>

  private readonly onClick = () => {
    this.props.showDetails(this.label(), this.detailTitle, this.detailBody)
  }

  private summaryHeader() {
    return (
      <CardHeader actions={this.actions()} className="codeflare--card-header-no-wrap">
        <span className="codeflare--card-icon">{this.icon()}</span>
      </CardHeader>
    )
  }

  private summaryTitle() {
    return <CardTitle>{this.label()}</CardTitle>
  }

  private summaryBody() {
    return (
      <CardBody>
        <DescriptionList isCompact>{this.summaryGroups()}</DescriptionList>
      </CardBody>
    )
  }

  private card() {
    return (
      <Card
        isLarge
        isClickable
        isSelectableRaised
        isSelected={this.props.currentSelection === this.label()}
        onClick={this.onClick}
      >
        {this.summaryHeader()}
        {this.summaryTitle()}
        {this.summaryBody()}
      </Card>
    )
  }

  public override render() {
    return this.card()
  }
}
