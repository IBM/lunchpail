import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import GridCell from "./GridCell"
import GridLayout from "./GridLayout"

export interface WorkerPoolModel {
  sizeInbox: number[]
  sizeOutbox: number[]
  status: string // "unknown" | "pending" | "completed" | "error" | "running"
  numTiles: number
  startTime: number
  numTilesProcessed: number
  label: string
}

interface props {
  model: WorkerPoolModel
}

export default class WorkerPool extends PureComponent<props> {
  public wpLabel() {
    return <strong>WorkerPool {this.props.model.label}</strong>
  }

  public isEmpty(numArr: number[]) {
    if (numArr.length == 0) {
      return "Waiting for queues..."
    }
  }

  public override render() {
    const inboxArr = this.props.model.sizeInbox
    // console.log("Worker: ", { inboxArr }); // FOR DEBUGGING
    return (
      <Flex direction={{ default: "column" }} style={{ height: "100%" }}>
        {/* This is the inbox, or "grid" of queues, which come from the particular WorkerPool data */}
        {this.isEmpty(inboxArr)}

        <FlexItem>
          <Flex gap={{ default: "gapXs" }}>
            {inboxArr.map((_, i) => (
              <GridLayout key={i} queueNum={i + 1} queueLength={inboxArr[i]} queueStatus={this.props.model.status} />
            ))}
          </Flex>
        </FlexItem>

        <FlexItem>
          {/* This is the grid that contains the particular WorkerPool data */}
          <Flex gap={{ default: "gapXs" }}>
            {inboxArr.map((_, index) => (
              <FlexItem key={index}>
                <Flex alignItems={{ default: "alignItemsCenter" }} justifyContent={{ default: "justifyContentCenter" }}>
                  <GridCell type="worker" />
                </Flex>
              </FlexItem>
            ))}
          </Flex>
        </FlexItem>
        {this.wpLabel()}
      </Flex>
    )
  }
}
