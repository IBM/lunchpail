import changeMaker from "change-maker"
import { Flex } from "@patternfly/react-core"

import Cell, { type CellKind } from "./Cell"
import { gapXs, alignItemsCenter } from "./styles"

import "./Cells.scss"

export type Props = {
  /** Number of cells to display */
  count: number

  /** What kind of activity do these cells represent */
  kind: CellKind
}

/**
 * `change-maker` works in terms of dollar currency, but accepts coins
 * in terms of cents. To avoid propagation of rounding errors, we
 * convert our cents to dollars here (*100), and then do a /100 at the
 * very end -- i.e. in this way we get only a single rounding error.
 */
const coinDenominations: number[] = [1, 25, 100, 1000].map((_) => _ * 100)

/**
 * An array of `props.count` <Cell/> components decorated to look like `props.kind`
 */
export function CellsInner(props: Props) {
  return (
    // changeMaker() returns a mapping from coin denomination
    // the number of such coins ('value'). Currently,
    // changeMaker() requires that the first paramter be a
    // currency, so we add the '$' prefix
    Object.entries(changeMaker("$" + props.count, coinDenominations))
      .reverse()
      // Find the number of stacks that are being used to render 'size' <Cell/> by finding the non-zero values from changeMaker()
      .filter(([, numStacks]) => numStacks > 0)
      .map(([stackDepth, numStacks]) =>
        // Finally, render 'numStacks' stacks of <Cell/>. 'stackDepth' represents how many <Cell/> there are in that stack.
        Array(numStacks)
          .fill(0)
          .map((_, idx) => <Cell key={idx} kind={props.kind} stackDepth={parseInt(stackDepth, 10) / 100} />),
      )
  )
}

export default function Cells(props: Props) {
  return (
    <Flex className="codeflare--workqueue" gap={gapXs} alignItems={alignItemsCenter}>
      <CellsInner {...props} />
    </Flex>
  )
}
