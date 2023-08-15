import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import Queue, { Props as QueueProps } from "./Queue"

type Props = QueueProps & {
  queueNum: number
}

/** Each item grid is a Queue component. Each Queue will be printed on its own column */
export default class GridLayout extends PureComponent<Props> {
  public labelForQueue() {
    return <div style={{ textAlign: "center", fontSize: "0.75em" }}>W{this.props.queueNum.toString()}</div>
  }

  public override render() {
    return (
      <Flex alignSelf={{ default: "alignSelfFlexEnd" }}>
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
