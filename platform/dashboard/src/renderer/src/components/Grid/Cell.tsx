import { Tooltip } from "@patternfly/react-core"

import "./Cell.scss"

/** What kind of activity does this cell represent */
export type CellKind = "pending" | "running" | "completed"

import HealthyIcon from "@patternfly/react-icons/dist/esm/icons/check-icon"

type Props = {
  /** Represents how many GridCells there are in a stack */
  stackDepth: number

  /** What kind of activity does this cell represent */
  kind: CellKind
}

export default function GridCell(props: Props) {
  const index = props.kind === "pending" ? 4 : props.kind === "running" ? 3 : 1
  const tooltip = (
    <>
      This cell represents {props.stackDepth.toString()} <strong>{props.kind}</strong>{" "}
      {props.stackDepth === 1 ? "task" : "tasks"}.
    </>
  )

  return (
    <Tooltip content={tooltip}>
      <div className="codeflare--grid-cell" data-index={index} data-depth={props.stackDepth}>
        {props.kind === "completed" && <HealthyIcon className="codeflare--status-completed" />}
        <span>{props.stackDepth}</span>
      </div>
    </Tooltip>
  )
}
