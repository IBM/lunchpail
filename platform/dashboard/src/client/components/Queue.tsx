import { Component } from "react";
import { BoxStyle } from "../style";

type Props = {
  queueLength: number;
  queueStatus: string;
};

export class Queue extends Component<Props> {
  /** Assigning the queue a color depending on the status */
  private cellStatusColor(status: string): string {
    const allStatuses = ["unknown", "pending", "completed", "error", "running"];
    switch (status) {
      case allStatuses[0]:
        return "grey";
      case allStatuses[1]:
        return "orange";
      case allStatuses[2]:
        return "green";
      case allStatuses[3]:
        return "red";
      case allStatuses[4]:
        return "yellow";
      default:
        return "grey";
    }
  }

  private queueCellLabel(labelNum: number) {
    const label: string = "Q" + (labelNum + 1);
    return label;
  }

  /** Rendering one cell */
  private cell(status: string, labelNum: number) {
    const color = this.cellStatusColor(status);
    return <div style={BoxStyle(color)}>{this.queueCellLabel(labelNum)}</div>;
  }

  /** Returns a horizontal array of objects containing cells */
  private queue(status: string) {
    const queue = Array(this.props.queueLength);
    for (let i = 0; i < this.props.queueLength; i++) {
      queue.fill(this.cell(status, i));
    }
    return queue;
  }

  public override render() {
    const status = this.props.queueStatus;
    return <div>{this.queue(status)}</div>;
  }
}
