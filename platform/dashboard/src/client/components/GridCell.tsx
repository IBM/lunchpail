import "./GridCell.scss"

export type GridTypeData = "inbox" | "outbox" | "processing" | "waiting"
type GridType = GridTypeData | "worker"

type Props = {
  type: GridType
  dataset: number
}

export default function GridCell(props: Props) {
  return <div className="codeflare--grid-cell" data-type={props.type} data-dataset={props.dataset} />
}
