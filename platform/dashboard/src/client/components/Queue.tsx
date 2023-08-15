import { PureComponent } from "react"
import { Flex } from "@patternfly/react-core"

import GridCell, { GridTypeData } from "./GridCell"

export type Props = {
  sizeInbox: number
  sizeOutbox: number
  sizeProcessing: number
}

export default class Queue extends PureComponent<Props> {
  /** Render one cell */
  private cell(cellType: GridTypeData, labelNum: number) {
    return <GridCell key={labelNum} type={cellType} />
  }

  /** @return an array of GridCells */
  private queue(N: number, cellType: GridTypeData) {
    return Array(N)
      .fill(0)
      .map((_, idx) => this.cell(cellType, idx))
  }

  public override render() {
    return (
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
        {this.queue(this.props.sizeOutbox, "outbox")}
        {this.queue(this.props.sizeInbox, "inbox")}
        {this.props.sizeProcessing > 0 ? this.queue(this.props.sizeProcessing, "processing") : this.queue(1, "waiting")}
      </Flex>
    )
  }
}
