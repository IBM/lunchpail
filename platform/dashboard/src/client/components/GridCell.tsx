import "./GridCell.scss"

type GridType = "data" | "worker"

type Props = {
  gridType: GridType
}

export default function GridCell(props: Props) {
  return <div className="codeflare--grid-cell" data-type={props.type} />
}
