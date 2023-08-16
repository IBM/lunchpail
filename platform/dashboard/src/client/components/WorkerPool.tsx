import { PureComponent } from "react"
import { Card, CardBody, CardTitle, Flex, FlexItem } from "@patternfly/react-core"

import GridCell from "./GridCell"
import GridLayout from "./GridLayout"
import type WorkerPoolModel from "./WorkerPoolModel"

interface props {
  model: WorkerPoolModel
  datasetIndex: Record<string, number>
}

export default class WorkerPool extends PureComponent<props> {
  public wpLabel() {
    return `WorkerPool ${this.props.model.label}`
  }

  public isEmpty(numArr: number[]) {
    if (numArr.length == 0) {
      return "Waiting for queues..."
    }
  }

  public override render() {
    const inboxArr = this.props.model.inbox
    const outboxArr = this.props.model.outbox
    const processingArr = this.props.model.processing

    return (
      <Card isCompact isPlain>
        <CardTitle component="h4">{this.wpLabel()}</CardTitle>

        <CardBody>
          <Flex direction={{ default: "column" }} style={{ height: "100%" }}>
            {/* This is the inbox, or "grid" of queues, which come from the particular WorkerPool data */}
            {this.isEmpty(inboxArr)}

            <FlexItem>
              <Flex gap={{ default: "gapXs" }}>
                {inboxArr.map((_, i) => (
                  <GridLayout
                    key={i}
                    queueNum={i + 1}
                    processing={processingArr[i]}
                    inbox={inboxArr[i]}
                    outbox={outboxArr[i]}
                    datasetIndex={this.props.datasetIndex}
                  />
                ))}
              </Flex>
            </FlexItem>

            <FlexItem>
              {/* This is the grid that contains the particular WorkerPool data */}
              <Flex gap={{ default: "gapXs" }}>
                {inboxArr.map((_, index) => (
                  <FlexItem key={index}>
                    <Flex
                      alignItems={{ default: "alignItemsCenter" }}
                      justifyContent={{ default: "justifyContentCenter" }}
                    >
                      <GridCell type="worker" />
                    </Flex>
                  </FlexItem>
                ))}
              </Flex>
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>
    )
  }
}
