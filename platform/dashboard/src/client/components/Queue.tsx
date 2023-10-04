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
  // change-maker works in terms of dollar currency, but accepts coins
  // in terms of cents. To avoid propagation of rounding errors, we
  // convert our cents to dollars here (*100), and then do a /100 at the very
  // end -- i.e. in this way we get only a single rounding error.
  private readonly coinDenominations: number[] = [1, 10, 100, 1000].map((_) => _ * 100)

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
        // gridCellStacking() returns a mapping from coin denomination
        // the number of such coins ('value'). Currently,
        // gridCellStacking() requires that the first paramter be a
        // currency, so we add the '$' prefix
        //
        return (
          Object.entries(gridCellStacking("$" + size, this.coinDenominations))
            // Find the number of stacks that are being used to render 'size' GridCells by finding the non-zero values from gridCellStacking()
            .filter(([, numStacks]) => numStacks > 0)
            .map(([stackDepth, numStacks]) =>
              // Finally, render 'numStacks' stacks of GridCells. 'stackDepth' represents how many GridCells there are in that stack.
              // TODO: denote a stack changed depth via darker color change in the next PR
              Array(numStacks)
                .fill(0)
                .map((_, idx) => this.cell(cellType, dataset, idx, parseInt(stackDepth, 10) / 100)),
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
