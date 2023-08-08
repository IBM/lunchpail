import { Component } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import { GridLayout } from "./index";
import { BoxStyle } from "../style";

export interface WorkerPoolModel {
  sizeInbox: number[];
  sizeOutbox: number[];
  status: string; // "unknown" | "pending" | "completed" | "error" | "running"
  numTiles: number;
  startTime: number;
  numTilesProcessed: number;
  label: string;
}

interface props {
  model: WorkerPoolModel;
}

export class WorkerPool extends Component<props> {
  public wpLabel() {
    return (
      <text style={{ marginLeft: "10%" }}>
        WorkerPool {this.props.model.label}
      </text>
    );
  }

  public isEmpty(numArr: number[]) {
    if (numArr.length == 0) {
      return <text>Waiting for queues...</text>;
    }
  }

  public override render() {
    const inboxArr = this.props.model.sizeInbox;
    // console.log("Worker: ", { inboxArr }); // FOR DEBUGGING
    return (
      <>
        {/* This is the inbox, or "grid" of queues, which come from the particular WorkerPool data */}
        {this.isEmpty(inboxArr)}
        <Flex>
          {inboxArr.map((_, i) => (
            <GridLayout
              queueNum={i + 1}
              queueLength={inboxArr[i]}
              queueStatus={this.props.model.status}
            />
          ))}
        </Flex>
        <text style={{ marginLeft: "10%" }}>Inbox</text>
        <br />
        {/* This is the grid that contains the particular WorkerPool data */}
        <Flex style={{ marginTop: "20%" }}>
          {inboxArr.map((_, index) => (
            <FlexItem key={index}>
              <div style={BoxStyle("lightblue")}>W{(index += 1)}</div>
            </FlexItem>
          ))}
        </Flex>
        {this.wpLabel()}
      </>
    );
  }
}
