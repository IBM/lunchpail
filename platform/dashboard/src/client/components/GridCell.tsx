import "./GridCell.scss"

export type GridTypeData = "inbox" | "outbox"
type GridType = GridTypeData | "worker"

type Props = {
  gridType: GridType
}

export default function GridCell(props: Props) {
  return <div className="codeflare--grid-cell" data-type={props.type} />
}
