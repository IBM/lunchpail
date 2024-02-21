import changeMaker from "change-maker"
import { Flex } from "@patternfly/react-core"

import Cell from "./Cell"
import { TaskQueueTask } from "@jaas/resources/workerpools/WorkerPoolModel"

import "./Cells.scss"

export type Props = {
  /** Number of tasks in the inbox/unassigned */
  inbox: TaskQueueTask
}

/**
 * `change-maker` works in terms of dollar currency, but accepts coins
 * in terms of cents. To avoid propagation of rounding errors, we
 * convert our cents to dollars here (*100), and then do a /100 at the
 * very end -- i.e. in this way we get only a single rounding error.
 */
const coinDenominations: number[] = [1, 10, 100, 1000].map((_) => _ * 100)

/** Render one cell */
function cell(taskqueue: string, labelNum: number, stackDepth: number) {
  const key = taskqueue + "." + labelNum + "." + stackDepth
  return <Cell key={key} stackDepth={stackDepth} />
}

/** @return an array of Cells */
function queue(tasks: TaskQueueTask) {
  return Object.entries(tasks || {})
    .filter(([, size]) => size > 0)
    .flatMap(([taskqueue, size]) => {
      // changeMaker() returns a mapping from coin denomination
      // the number of such coins ('value'). Currently,
      // changeMaker() requires that the first paramter be a
      // currency, so we add the '$' prefix
      return (
        Object.entries(changeMaker("$" + size, coinDenominations))
          .reverse()
          // Find the number of stacks that are being used to render 'size' <Cell/> by finding the non-zero values from changeMaker()
          .filter(([, numStacks]) => numStacks > 0)
          .map(([stackDepth, numStacks]) =>
            // Finally, render 'numStacks' stacks of <Cell/>. 'stackDepth' represents how many <Cell/> there are in that stack.
            Array(numStacks)
              .fill(0)
              .map((_, idx) => cell(taskqueue, idx, parseInt(stackDepth, 10) / 100)),
          )
      )
    })
}

export default function Cells(props: Props) {
  return (
    <Flex className="codeflare--workqueue" gap={{ default: "gapXs" }}>
      {queue(props.inbox)}
    </Flex>
  )
}
