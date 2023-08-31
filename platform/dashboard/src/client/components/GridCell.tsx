import { PureComponent } from "react"
import "./GridCell.scss"

export type GridTypeData = "plain" | "inbox" | "outbox" | "processing" | "waiting" | "placeholder" | "unassigned"
type GridType = GridTypeData | "worker"

type Props = {
  type?: GridType
  dataset?: number
}

export default class GridCell extends PureComponent<Props> {
  private innerText() {
    return <span>{this.props.type === "outbox" ? "↑" : this.props.type === "inbox" ? "↓" : "\u00a0"}</span>
  }

  public render() {
    // \u00a0 is &nbsp in unicode
    return (
      <div className="codeflare--grid-cell" data-type={this.props.type || "plain"} data-dataset={this.props.dataset}>
        {this.innerText()}
      </div>
    )
  }
}
