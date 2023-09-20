import { PropsWithChildren, PureComponent } from "react"
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
  Stack,
  StackItem,
} from "@patternfly/react-core"

import Sparkline from "./Sparkline"
import SmallLabel from "./SmallLabel"
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

function Work(
  props: PropsWithChildren<Pick<Props, "idx"> & { label: string; count: number; history: Props["inboxHistory"] }>,
) {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        <SmallLabel count={props.count}>{props.label}</SmallLabel>
      </DescriptionListTerm>

      <DescriptionListDescription>
        <Stack hasGutter>
          <StackItem>
            <Flex
              className="codeflare--workqueue"
              gap={{ default: "gapXs" }}
              flexWrap={{ default: "nowrap" }}
              style={{ width: "calc((4px + 1.375em) * 8 - 3px)", alignContent: "flex-start", overflow: "hidden" }}
            >
              {props.children}
            </Flex>
          </StackItem>

          {props.history.length > 0 && (
            <StackItem>
              <Sparkline data={props.history} datasetIdx={props.idx} />
            </StackItem>
          )}
        </Stack>
      </DescriptionListDescription>
    </DescriptionListGroup>
  )
}

export default class DataSet extends PureComponent<Props> {
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

  private unassigned() {
    return this.stack(this.props.inbox, "unassigned")
  }

  private outbox() {
    return <Sparkline data={completionRateHistory(this.props)} />
  }

  public override render() {
    return (
      <Card isRounded>
        <CardHeader>
          <CardTitle>
            <DataSetIcon /> {this.props.label}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <DescriptionList isCompact>
            <Work
              label="Unassigned Work"
              count={this.props.inbox}
              idx={this.props.idx}
              history={this.props.inboxHistory}
            >
              {this.unassigned()}
            </Work>

            <DescriptionListGroup>
              <DescriptionListTerm>
                <SmallLabel count={meanCompletionRate(this.props)}>Completion Rate</SmallLabel>
              </DescriptionListTerm>
              <DescriptionListDescription>{this.outbox()}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
