import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import Queue, { Props as QueueProps } from "./Queue"

import "../App.scss"

type Props = QueueProps & {
  queueNum: number
  maxNWorkers: number
}

/** Each item grid is a Queue component. Each Queue will be printed on its own column */
export default class GridLayout extends PureComponent<Props> {
  private count(model: Props["inbox"]) {
    return Object.values(model).reduce((sum, depth) => sum + depth, 0)
  }

  private get nIn() {
    return this.count(this.props.inbox)
  }

  private get nOut() {
    return this.count(this.props.outbox || {})
  }

  public name() {
    return <SmallLabel align="right">W{this.props.queueNum}</SmallLabel>
  }

  public depth() {
    return (
      <SmallLabel>
        {this.nIn} ↓ {this.nOut} ↑
      </SmallLabel>
    )
  }

  public override render() {
    return (
      <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsCenter" }}>
        <FlexItem style={{ textAlign: "right", minWidth: 1.5 + (this.props.maxNWorkers - 10) * 0.25 + "em" }}>
          {this.name()}
        </FlexItem>

        <FlexItem>
          <Queue inbox={this.props.inbox} outbox={this.props.outbox} datasetIndex={this.props.datasetIndex} />
        </FlexItem>

        <FlexItem>{this.depth()}</FlexItem>
      </Flex>
    )
  }
}
