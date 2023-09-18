import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import Queue, { Props as QueueProps } from "./Queue"

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

  public name() {
    return (
      <SmallLabel size="xxs" align="right">
        {this.props.queueNum}
      </SmallLabel>
    )
  }

  public override render() {
    return (
      <Flex
        gap={{ default: "gapXs" }}
        alignItems={{ default: "alignItemsCenter" }}
        className="codeflare--workqueues-row"
      >
        <FlexItem
          style={{ textAlign: "right", width: 1 + (this.props.maxNWorkers - 10) * 0.25 + "em" }}
          className="codeflare--workqueues-cell"
        >
          {this.name()}
        </FlexItem>

        <FlexItem className="codeflare--workqueues-cell">
          <Queue inbox={this.props.inbox} datasetIndex={this.props.datasetIndex} />
        </FlexItem>
      </Flex>
    )
  }
}
