import type { PropsWithChildren } from "react"
import { Flex, FlexItem, Stack, StackItem } from "@patternfly/react-core"

import Sparkline from "./Sparkline"
import CardInGallery from "./CardInGallery"
import GridCell, { GridTypeData } from "./GridCell"

import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import type DataSetModel from "./DataSetModel"

import DataSetIcon from "@patternfly/react-icons//dist/esm/icons/database-icon"
export { DataSetIcon }

import "./Queue.scss"

type Props = Pick<DataSetModel, "idx" | "label"> & {
  events: DataSetModel[]
  numEvents: number
}

function Work(props: PropsWithChildren<Pick<Props, "idx"> & { history: number[] }>) {
  return (
    <Stack hasGutter>
      <StackItem>
        <Flex className="codeflare--workqueue" gap={{ default: "gapXs" }}>
          {props.children}
        </Flex>
      </StackItem>

      <StackItem>{props.history.length > 0 && <Sparkline data={props.history} datasetIdx={props.idx} />}</StackItem>
    </Stack>
  )
}

export default class DataSet extends CardInGallery<Props> {
  private stack(count: number, gridDataType: GridTypeData) {
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

  private outbox() {
    return <Sparkline data={completionRateHistory(this.props.events)} />
  }

  protected override kind() {
    return "Data Set"
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
      <Work idx={this.props.idx} history={this.inboxHistory}>
        {this.stack(this.inboxCount, "unassigned")}
      </Work>,
      this.inboxCount,
    )
  }

  private completions() {
    return this.descriptionGroup("Completion Rate", this.outbox(), meanCompletionRate(this.props.events))
  }

  protected override summaryGroups() {
    return [this.storageType(), this.bucket(), this.unassigned(), this.completions()]
  }
}
