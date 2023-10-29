import { Tooltip } from "@patternfly/react-core"
import SpinnerIcon from "@patternfly/react-icons/dist/esm/icons/spinner2-icon"

import "./GridCell.scss"

export type GridTypeData = "plain" | "inbox" | "outbox" | "processing" | "waiting" | "placeholder" | "unassigned"
type GridType = GridTypeData | "worker"

type Props = {
  type?: GridType
  taskqueue?: number

  /** Represents how many GridCells there are in a stack */
  stackDepth: number
}

function InnerText(props: Props) {
  return (
    <span>
      {props.type === "processing" ? (
        <SpinnerIcon />
      ) : props.type === "outbox" ? (
        "↑"
      ) : props.type === "inbox" ? (
        "↓"
      ) : (
        "\u00a0"
      )}
    </span>
  )
}

export default function GridCell(props: Props) {
  return (
    <Tooltip
      content={`This cell represents ${props.stackDepth.toString()} ${props.stackDepth === 1 ? "task" : "tasks"}.`}
    >
      <div
        className="codeflare--grid-cell"
        data-type={props.type || "plain"}
        data-index={props.taskqueue}
        data-depth={props.stackDepth}
      >
        <InnerText {...props} />
      </div>
    </Tooltip>
  )
}
