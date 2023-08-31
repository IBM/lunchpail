import { Sparklines, SparklinesLine } from "react-sparklines-typescript-v2"

import "./Sparkline.scss"

export default function SparkLine(props: { datasetIdx?: number; data: number[] }) {
  return (
    <div className="codeflare--sparkline" data-dataset={props.datasetIdx}>
      <Sparklines data={props.data} limit={30} width={100} height={20} margin={5}>
        <SparklinesLine />
      </Sparklines>
    </div>
  )
}
