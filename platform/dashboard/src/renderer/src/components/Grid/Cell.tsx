import { Tooltip } from "@patternfly/react-core"

import "./Cell.scss"

/** What kind of activity does this cell represent */
export type CellKind = "running" | "pending" | "done"

type Props = {
  /** Represents how many GridCells there are in a stack */
  stackDepth: number

  /** What kind of activity does this cell represent */
  kind: CellKind
}

export default function GridCell(props: Props) {
  const index = props.kind === "pending" ? 4 : props.kind === "running" ? 3 : 1

  return (
    <Tooltip
      content={`This cell represents ${props.stackDepth.toString()} ${props.stackDepth === 1 ? "task" : "tasks"}.`}
    >
      <div className="codeflare--grid-cell" data-index={index} data-depth={props.stackDepth} />
    </Tooltip>
  )
}
