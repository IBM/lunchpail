import { PureComponent } from "react"
import { Flex } from "@patternfly/react-core"
import { BoxStyle } from "../style"

type Props = {
  queueLength: number
  queueStatus: string
}

export class Queue extends PureComponent<Props> {
  /** Assigning the queue a color depending on the status */
  private cellStatusColor(status: string): string {
    const allStatuses = ["unknown", "pending", "completed", "error", "running"]
    switch (status) {
      case allStatuses[0]:
        return "grey"
      case allStatuses[1]:
        return "orange"
      case allStatuses[2]:
        return "green"
      case allStatuses[3]:
        return "red"
      case allStatuses[4]:
        return "yellow"
      default:
        return "grey"
    }
  }

  private queueCellLabel() {
    //const label: string = "D" + (labelNum + 1);
    //return label;
    return ""
  }

  /** Rendering one cell */
  private cell(status: string, labelNum: number) {
    //const color = this.cellStatusColor(status);
    return (
      <div key={labelNum} style={BoxStyle("#FC6769")}>
        {this.queueCellLabel()}
      </div>
    )
  }

  /** Returns a horizontal array of objects containing cells */
  private queue(status: string) {
    return Array(this.props.queueLength)
      .fill(0)
      .map((_, idx) => this.cell(status, idx))
  }

  public override render() {
    const status = this.props.queueStatus
    return (
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
        {this.queue(status)}
      </Flex>
    )
  }
}
