import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import Queue from "./Queue"

type Props = {
  queueNum: number
  sizeInbox: number
  sizeOutbox: number
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
          <Queue sizeInbox={this.props.sizeInbox} sizeOutbox={this.props.sizeOutbox} />
          {this.labelForQueue()}
        </FlexItem>
      </Flex>
    )
  }
}
