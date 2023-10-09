import { PureComponent } from "react"
import { Tooltip } from "@patternfly/react-core"
import SpinnerIcon from "@patternfly/react-icons/dist/esm/icons/spinner2-icon"

import "./GridCell.scss"

export type GridTypeData = "plain" | "inbox" | "outbox" | "processing" | "waiting" | "placeholder" | "unassigned"
type GridType = GridTypeData | "worker"

type Props = {
  type?: GridType
  dataset?: number

  /** Represents how many GridCells there are in a stack */
  stackDepth: number
}

export default class GridCell extends PureComponent<Props> {
  private innerText() {
    return (
      <span>
        {this.props.type === "processing" ? (
          <SpinnerIcon />
        ) : this.props.type === "outbox" ? (
          "↑"
        ) : this.props.type === "inbox" ? (
          "↓"
        ) : (
          "\u00a0"
        )}
      </span>
    )
  }

  public render() {
    return (
      <Tooltip
        content={`This cell represents ${this.props.stackDepth.toString()} ${
          this.props.stackDepth === 1 ? "task" : "tasks"
        }.`}
      >
        <div
          className="codeflare--grid-cell"
          data-type={this.props.type || "plain"}
          data-dataset={this.props.dataset}
          data-depth={this.props.stackDepth}
        >
          {this.innerText()}
        </div>
      </Tooltip>
    )
  }
}
