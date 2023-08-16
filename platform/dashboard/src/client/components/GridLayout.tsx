import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import Queue, { Props as QueueProps } from "./Queue"

import "../App.scss"

type Props = QueueProps & {
  queueNum: number
}

/** Each item grid is a Queue component. Each Queue will be printed on its own column */
export default class GridLayout extends PureComponent<Props> {
  public labelForQueue() {
    return <SmallLabel isCentered>W{this.props.queueNum}</SmallLabel>
  }

  public override render() {
    return (
      <Flex alignSelf={{ default: "alignSelfFlexEnd" }} justifyContent={{ default: "justifyContentCenter" }}>
        <FlexItem>
          <Queue
            inbox={this.props.inbox}
            outbox={this.props.outbox}
            processing={this.props.processing}
            datasetIndex={this.props.datasetIndex}
          />
          {this.labelForQueue()}
        </FlexItem>
      </Flex>
    )
  }
}
