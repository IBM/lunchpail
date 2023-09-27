import isUrl from "is-url-superb"
import { isValidElement, PureComponent } from "react"
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
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

  /**
   * Signify that there is no corresponding... something, e.g. an
   * Application with no corresponding DataSet, or vice versa.
   */
  protected none() {
    return <i>None</i>
  }

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
      if (Array.isArray(description)) {
        return description.join(",")
      } else {
        const entries = Object.entries(description).filter(([, value]) => !!value)
        if (entries.length > 0) {
          return (
            <List isPlain isBordered>
              {entries.map(([key, value]) => (
                <ListItem key={key}>{value}</ListItem>
              ))}
            </List>
          )
        }
      }
    } else {
      return description
    }
  }

  protected descriptionGroup(
    term: ReactNode,
    description: ReactNode | Record<string, string>,
    count?: number | string,
  ) {
    const desc = this.description(description)
    if (desc) {
      return (
        <DescriptionListGroup key={String(term)}>
          <DescriptionListTerm>
            <SmallLabel count={count}>
              <span className="codeflare--capitalize">{term}</span>
            </SmallLabel>
          </DescriptionListTerm>
          <DescriptionListDescription>{desc}</DescriptionListDescription>
        </DescriptionListGroup>
      )
    }
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
    return `${this.kind()}-${this.label()}`
  }

  private readonly onClick = () => {
    this.props.showDetails({ id: this.selectionId, title: this.detailTitle, body: this.detailBody })
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
    return <DescriptionList>{this.summaryGroups()}</DescriptionList>
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
        isSelected={this.props.currentSelection === this.selectionId}
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
