import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import { DataSetTask } from "./WorkerPoolModel"
import GridCell, { GridTypeData } from "./GridCell"

import "./Queue.scss"

export type Props = {
  inbox: DataSetTask
  datasetIndex: Record<string, number>
  gridTypeData: GridTypeData
}

export default class Queue extends PureComponent<Props> {
  /** Render one cell */
  private cell(cellType: GridTypeData, dataset: string, labelNum: number) {
    return (
      <FlexItem key={dataset + "." + labelNum + "." + cellType + "." + this.props.datasetIndex[dataset]}>
        <GridCell type={cellType} dataset={this.props.datasetIndex[dataset]} />
      </FlexItem>
    )
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

  public override render() {
    return (
      <Flex className="codeflare--workqueue" gap={{ default: "gapXs" }}>
        {this.queue(this.props.inbox, this.props.gridTypeData)}
      </Flex>
    )
  }
}
