import gridCellStacking from "change-maker"
import { Flex, FlexItem } from "@patternfly/react-core"

import Cell, { GridTypeData } from "./Cell"
import { TaskQueueTask } from "../../content/workerpools/WorkerPoolModel"

import "./Cells.scss"

export type Props = {
  inbox: TaskQueueTask
  taskqueueIndex: Record<string, number>
  gridTypeData: GridTypeData
}

/**
 * `change-maker` works in terms of dollar currency, but accepts coins
 * in terms of cents. To avoid propagation of rounding errors, we
 * convert our cents to dollars here (*100), and then do a /100 at the
 * very end -- i.e. in this way we get only a single rounding error.
 */
const coinDenominations: number[] = [1, 10, 100, 1000].map((_) => _ * 100)

export default function Cells(props: Props) {
  /** Render one cell */
  function cell(cellType: GridTypeData, taskqueue: string, labelNum: number, stackDepth: number) {
    return (
      <FlexItem
        key={taskqueue + "." + labelNum + "." + cellType + "." + props.taskqueueIndex[taskqueue] + "." + stackDepth}
      >
        <Cell type={cellType} taskqueue={props.taskqueueIndex[taskqueue]} stackDepth={stackDepth} />
      </FlexItem>
    )
  }

  /** @return an array of Cells */
  function queue(tasks: TaskQueueTask, cellType: GridTypeData) {
    return Object.entries(tasks || {})
      .filter(([, size]) => size > 0)
      .flatMap(([taskqueue, size]) => {
        // gridCellStacking() returns a mapping from coin denomination
        // the number of such coins ('value'). Currently,
        // gridCellStacking() requires that the first paramter be a
        // currency, so we add the '$' prefix
        return (
          Object.entries(gridCellStacking("$" + size, coinDenominations))
            .reverse()
            // Find the number of stacks that are being used to render 'size' <Cell/> by finding the non-zero values from gridCellStacking()
            .filter(([, numStacks]) => numStacks > 0)
            .map(([stackDepth, numStacks]) =>
              // Finally, render 'numStacks' stacks of <Cell/>. 'stackDepth' represents how many <Cell/> there are in that stack.
              Array(numStacks)
                .fill(0)
                .map((_, idx) => cell(cellType, taskqueue, idx, parseInt(stackDepth, 10) / 100)),
            )
        )
      })
  }

  return (
    <Flex className="codeflare--workqueue" gap={{ default: "gapXs" }}>
      {queue(props.inbox, props.gridTypeData)}
    </Flex>
  )
}
