import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import { DataSetTask } from "./WorkerPoolModel"
import GridCell, { GridTypeData } from "./GridCell"

import "./Queue.scss"
import gridCellStacking from "change-maker"

export type Props = {
  inbox: DataSetTask
  datasetIndex: Record<string, number>
  gridTypeData: GridTypeData
}

export default class Queue extends PureComponent<Props> {
  /** Render one cell */
  private cell(cellType: GridTypeData, dataset: string, labelNum: number, stackDepth: number) {
    return (
      <FlexItem
        key={dataset + "." + labelNum + "." + cellType + "." + this.props.datasetIndex[dataset] + "." + stackDepth}
      >
        <GridCell type={cellType} dataset={this.props.datasetIndex[dataset]} stackDepth={stackDepth} />
      </FlexItem>
    )
  }

  /** @return an array of GridCells */
  private queue(tasks: DataSetTask, cellType: GridTypeData) {
    return Object.entries(tasks || {})
      .filter(([, size]) => size > 0)
      .flatMap(([dataset, size]) => {
        /**
         * gridCellStacking() returns a mapping from coin denomination to a the first
         * parameter, 'value'. Currently, gridCellStacking() requires that 'value' be
         * a number representing US cents, so we hard-code the '$' below and divide
         * the number 'size' by 100 to get number representing the depth of a stack.
         */
        const coinDenominations: number[] = [1, 5, 10, 50, 100, 500, 1000]
        return (
          Object.entries(gridCellStacking("$" + size / 100, coinDenominations))
            // Find the number of stacks that are being used to render 'size' GridCells by finding the non-zero values from gridCellStacking()
            .filter(([, numStacks]) => numStacks > 0)
            .map(([stackDepth, numStacks]) =>
              // Finally, render 'numStacks' stacks of GridCells. 'stackDepth' represents how many GridCells there are in that stack.
              // TODO: denote a stack changed depth via darker color change in the next PR
              Array(numStacks)
                .fill(0)
                .map((_, idx) => this.cell(cellType, dataset, idx, parseInt(stackDepth, 10))),
            )
        )
      })
  }

  public override render() {
    return (
      <Flex className="codeflare--workqueue" gap={{ default: "gapXs" }}>
        {this.queue(this.props.inbox, this.props.gridTypeData)}
      </Flex>
    )
  }
}
