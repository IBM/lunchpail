import {
  Sparklines,
  SparklinesLine,
  SparklinesBars,
  SparklinesReferenceLine,
  SparklinesReferenceLineTypes,
} from "react-sparklines-typescript-v2"

import "./Sparkline.scss"

export default function SparkLine(props: { taskqueueIdx?: number; data: number[]; type?: "columns" | "bars" }) {
  return (
    <div className="codeflare--sparkline" data-index={props.taskqueueIdx} data-type={props.type}>
      <Sparklines data={props.data} limit={30} width={100} height={20} margin={0} preserveAspectRatio="xMinYMid meet">
        {props.type === "bars" ? <SparklinesBars height={10} barWidth={2.5} /> : <SparklinesLine />}
        {props.type === "bars" && <SparklinesReferenceLine type={SparklinesReferenceLineTypes.mean} />}
      </Sparklines>
    </div>
  )
}
