import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { Button, Flex, FlexItem, Popover } from "@patternfly/react-core"

import Sparkline from "./Sparkline"
import CardInGallery from "./CardInGallery"
import GridCell, { GridTypeData } from "./GridCell"

import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import type DataSetModel from "./DataSetModel"

import HelpIcon from "@patternfly/react-icons/dist/esm/icons/help-icon"
import DataSetIcon from "@patternfly/react-icons/dist/esm/icons/database-icon"
export { DataSetIcon }

import "./Queue.scss"

type Props = Pick<DataSetModel, "idx" | "label"> & {
  events: DataSetModel[]
  numEvents: number
}

export default class DataSet extends CardInGallery<Props> {
  private cells(count: number, gridDataType: GridTypeData) {
    if (!count) {
      return <GridCell type="placeholder" dataset={this.props.idx} />
    }

    return Array(count)
      .fill(0)
      .map((_, index) => (
        <FlexItem key={index}>
          <GridCell type={gridDataType} dataset={this.props.idx} />
        </FlexItem>
      ))
  }

  protected override icon() {
    return <DataSetIcon />
  }

  protected override label() {
    return this.props.label
  }

  private get inboxHistory() {
    return this.props.events.map((_) => _.inbox)
  }

  private get outboxHistory() {
    return this.props.events.map((_) => _.outbox)
  }

  private get last() {
    return this.props.events.length === 0 ? null : this.props.events[this.props.events.length - 1]
  }

  private get inboxCount() {
    return this.last ? this.last.inbox : 0
  }

  private storageType() {
    return this.descriptionGroup("Storage Type", this.last ? this.last.storageType : "unknown")
  }

  private bucket() {
    return this.descriptionGroup("Bucket", this.last ? this.last.bucket : "unknown")
  }

  private unassigned() {
    return this.descriptionGroup(
      "Unassigned Work",
      <Flex className="codeflare--workqueue" gap={{ default: "gapXs" }}>
        {this.cells(this.inboxCount, "unassigned")}
      </Flex>,
      this.inboxCount,
    )
  }

  private unassignedChart() {
    return this.descriptionGroup(
      "Unassigned Work over Time",
      this.inboxHistory.length === 0 ? <></> : <Sparkline data={this.inboxHistory} datasetIdx={this.props.idx} />,
    )
  }

  private none() {
    return (
      <Popover
        headerContent="No progress being made"
        bodyContent={
          <span>
            Consider assigning a <Link to={`?dataset=${this.label()}#newpool`}>New Worker Pool</Link> to process this
            Data Set
          </span>
        }
      >
        <>
          None{" "}
          <Button className="codeflare--card-in-gallery-help-button" onClick={this.stopPropagation} variant="plain">
            <HelpIcon />
          </Button>
        </>
      </Popover>
    )
  }

  private completionRate() {
    return this.descriptionGroup("Completion Rate (mean)", meanCompletionRate(this.props.events) || this.none())
  }

  private completionRateChart() {
    return this.descriptionGroup(
      "Completion Rate over Time",
      <Sparkline data={completionRateHistory(this.props.events)} />,
    )
  }

  private commonGroups(): ReactNode[] {
    return [this.storageType(), this.bucket(), this.unassigned()]
  }

  protected override summaryGroups() {
    return [...this.commonGroups(), this.completionRate()]
  }

  protected override detailGroups() {
    return [...this.commonGroups(), this.completionRate(), this.unassignedChart(), this.completionRateChart()]
  }
}
