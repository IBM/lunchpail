import { PureComponent } from "react"
import { Flex } from "@patternfly/react-core"

import { DataSetTask } from "./WorkerPoolModel"
import GridCell, { GridTypeData } from "./GridCell"

export type Props = {
  inbox: DataSetTask
  outbox: DataSetTask
  processing: DataSetTask
  datasetIndex: Record<string, number>
}

export default class Queue extends PureComponent<Props> {
  /** Render one cell */
  private cell(cellType: GridTypeData, dataset: string, labelNum: number) {
    return <GridCell key={dataset + labelNum} type={cellType} dataset={this.props.datasetIndex[dataset]} />
  }

  /** @return an array of GridCells */
  private queue(tasks: DataSetTask, cellType: GridTypeData) {
    return Object.entries(tasks || {})
      .filter(([, size]) => size > 0)
      .flatMap(([dataset, size]) =>
        Array(size)
          .fill(0)
          .map((_, idx) => this.cell(cellType, dataset, idx)),
      )
  }

  /** @return UI to represent processing/waiting */
  private processing() {
    const processing = this.queue(this.props.processing, "processing")
    if (processing.length > 0) {
      return processing
    } else {
      return this.queue({ "": 1 }, "waiting")
    }
  }

  public override render() {
    return (
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
        {this.queue(this.props.outbox, "outbox")}
        {this.queue(this.props.inbox, "inbox")}
        {this.processing()}
      </Flex>
    )
  }
}
