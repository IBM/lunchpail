import { Tooltip } from "@patternfly/react-core"

import "./Cell.scss"

export type GridTypeData = "plain" | "inbox" | "outbox" | "processing" | "waiting" | "placeholder" | "unassigned"

type Props = {
  /** The index of the taskqueue that this cell is part of; we generate a `taskqueueIndex` to help keep consistent coloring across views */
  taskqueue?: number

  /** Represents how many GridCells there are in a stack */
  stackDepth: number
}

export default function GridCell(props: Props) {
  return (
    <Tooltip
      content={`This cell represents ${props.stackDepth.toString()} ${props.stackDepth === 1 ? "task" : "tasks"}.`}
    >
      <div className="codeflare--grid-cell" data-index={props.taskqueue} data-depth={props.stackDepth} />
    </Tooltip>
  )
}
