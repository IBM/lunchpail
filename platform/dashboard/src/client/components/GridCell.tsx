import "./GridCell.scss"

export type GridTypeData = "inbox" | "outbox" | "processing" | "waiting"
type GridType = GridTypeData | "worker"

type Props = {
  type: GridType
}

export default function GridCell(props: Props) {
  return <div className="codeflare--grid-cell" data-type={props.type} />
}
