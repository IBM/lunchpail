import isUrl from "is-url-superb"
import { isValidElement, PureComponent } from "react"
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  List,
  ListItem,
  Truncate,
} from "@patternfly/react-core"

import type { MouseEvent, ReactNode } from "react"
import type { CardHeaderActionsObject } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"

import type { DrilldownProps } from "../context/DrawerContext"

import YesIcon from "@patternfly/react-icons//dist/esm/icons/check-icon"
import NoIcon from "@patternfly/react-icons//dist/esm/icons/minus-icon"
import LinkIcon from "@patternfly/react-icons/dist/esm/icons/external-link-square-alt-icon"

import "./CardInGallery.scss"

type BaseProps = DrilldownProps

export default abstract class CardInGallery<Props> extends PureComponent<Props & BaseProps> {
  protected readonly stopPropagation = (evt: MouseEvent<HTMLElement>) => evt.stopPropagation()

  private description(description: ReactNode | Record<string, string>) {
    if (description === true || description === false) {
      return description ? <YesIcon /> : <NoIcon />
    } else if (typeof description === "string" && isUrl(description)) {
      return (
        <Button
          variant="link"
          target="_blank"
          icon={<LinkIcon />}
          iconPosition="right"
          href={description}
          component="a"
        >
          <Truncate content={description} />
        </Button>
      )
    } else if (description && typeof description === "object" && !isValidElement(description)) {
      return (
        <List isPlain isBordered>
          {Object.entries(description).map(([key, value]) => (
            <ListItem key={key}>{value}</ListItem>
          ))}
        </List>
      )
      return JSON.stringify(description)
    } else {
      return description
    }
  }

  protected descriptionGroup(
    term: ReactNode,
    description: ReactNode | Record<string, string>,
    count?: number | string,
  ) {
    return (
      <DescriptionListGroup key={String(term)}>
        <DescriptionListTerm>
          <SmallLabel count={count}>
            <span className="codeflare--capitalize">{term}</span>
          </SmallLabel>
        </DescriptionListTerm>
        <DescriptionListDescription>{this.description(description)}</DescriptionListDescription>
      </DescriptionListGroup>
    )
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

  private nameGroup() {
    return this.descriptionGroup("Name", this.label())
  }

  protected actions(): undefined | CardHeaderActionsObject {
    return undefined
  }

  private readonly detailTitle = () => this.kind()

  private readonly detailBody = () => (
    <DescriptionList displaySize="lg">{[this.nameGroup(), ...this.detailGroups()]}</DescriptionList>
  )

  /** An identifier that is unique across all Cards */
  private get selectionId() {
    return `${this.kind}-${this.label()}`
  }

  private readonly onClick = () => {
    this.props.showDetails(this.selectionId, this.detailTitle, this.detailBody)
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
        isClickable
        isSelectable
        isSelectableRaised
        isSelected={this.props.currentSelection === this.selectionId}
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
