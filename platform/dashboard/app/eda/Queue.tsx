import { Component } from "react";
import { Box } from "@mui/material";

type Props = {
  queueLength: number;
  queueStatus: string;
};

export class Queue extends Component<Props> {
  /** Assigning the queue a color depending on the status */
  private cellStatusColor(status: string) {
    const allStatuses = ["unknown", "pending", "completed", "error", "running"];
    switch (status) {
      case allStatuses[0]:
        return { color: "grey", dimColor: false };
      case allStatuses[1]:
        return { color: "orange", dimColor: false };
      case allStatuses[2]:
        return { color: "green", dimColor: false };
      case allStatuses[3]:
        return { color: "red", dimColor: false };
      case allStatuses[4]:
        return { color: "yellow", dimColor: false };
      default:
        return { color: "grey", dimColor: true };
    }
  }

  private queueCellLabel(labelNum: number) {
    const label: string = "Q" + (labelNum + 1);
    return label;
  }

  /** Rendering one cell */
  private cell(status: string, labelNum: number) {
    const style = this.cellStatusColor(status);
    return (
      <Box
        sx={{
          gap: 1,
          width: 30,
          height: 30,
          bgcolor: style.color,
          opacity: 0.8,
          "&:hover": {
            backgroundColor: "primary.dark",
            opacity: 0.5,
          },
        }}
      >
        {this.queueCellLabel(labelNum)}
      </Box>
    );
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
    return <Box sx={{ gap: 1 }}>{this.queue(status)}</Box>;
  }
}
