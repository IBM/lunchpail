import type { PropsWithChildren } from "react"
import { Flex, FlexItem, Stack, StackItem } from "@patternfly/react-core"

import Sparkline from "./Sparkline"
import CardInGallery from "./CardInGallery"
import GridCell, { GridTypeData } from "./GridCell"

import { meanCompletionRate, completionRateHistory } from "./CompletionRate"

import type DataSetModel from "./DataSetModel"
import type { QueueHistory } from "./WorkerPoolModel"

import DataSetIcon from "@patternfly/react-icons//dist/esm/icons/cubes-icon"
export { DataSetIcon }

import "./Queue.scss"

type Props = Omit<DataSetModel, "timestamp"> &
  QueueHistory & {
    idx: number
    inboxHistory: number[]
  }

function Work(props: PropsWithChildren<Pick<Props, "idx"> & { history: Props["inboxHistory"] }>) {
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
  private stack(model: Props["inbox"] | Props["outbox"], gridDataType: GridTypeData) {
    if (!model) {
      return <GridCell type="placeholder" dataset={this.props.idx} />
    }

    return Array(model || 0)
      .fill(0)
      .map((_, index) => (
        <FlexItem key={index}>
          <GridCell type={gridDataType} dataset={this.props.idx} />
        </FlexItem>
      ))
  }

  private outbox() {
    return <Sparkline data={completionRateHistory(this.props)} />
  }

  protected override icon() {
    return <DataSetIcon />
  }

  protected override label() {
    return this.props.label
  }

  private unassigned() {
    return this.descriptionGroup(
      "Unassigned Work",
      <Work idx={this.props.idx} history={this.props.inboxHistory}>
        {this.stack(this.props.inbox, "unassigned")}
      </Work>,
      this.props.inbox,
    )
  }

  private completions() {
    return this.descriptionGroup("Completion Rate", this.outbox(), meanCompletionRate(this.props))
  }

  protected override groups() {
    return [this.unassigned(), this.completions()]
  }
}
