import {
  Sparklines,
  SparklinesLine,
  SparklinesBars,
  SparklinesReferenceLine,
  SparklinesReferenceLineTypes,
} from "react-sparklines-typescript-v2"

import "./Sparkline.scss"

/** @return windowed average of `data` resulting in an array of length at most `N` */
function windowed(data: number[], N: number) {
  if (data.length <= N) {
    return data
  } else {
    const windowWidth = Math.round(data.length / N)

    const windowed = Array(N).fill(0)

    for (let idx = 1; idx < N - 1; idx++) {
      const startIdx = Math.floor(idx * windowWidth - windowWidth / 2)
      const endIdx = Math.min(data.length, Math.floor(idx * windowWidth + windowWidth / 2))
      let total = 0
      for (let jdx = startIdx; jdx < endIdx; jdx++) {
        total += data[jdx]
      }

      windowed[idx] = total / (endIdx - startIdx)
    }

    // first entry
    let total = 0
    const leftSideEndIdx = Math.min(data.length, windowWidth)
    for (let idx = 0; idx < leftSideEndIdx; idx++) {
      total += data[idx]
    }
    windowed[0] = total / leftSideEndIdx

    // last entry
    total = 0
    const rightSideStartIdx = Math.min(data.length, windowWidth * (N - 1))
    if (rightSideStartIdx === data.length) {
      windowed[N - 1] = windowed[N - 2]
    } else {
      for (let idx = rightSideStartIdx; idx < data.length; idx++) {
        total += data[idx]
      }
      windowed[N - 1] = total / (data.length - rightSideStartIdx)
    }

    return windowed
  }
}

export default function SparkLine(props: { data: number[]; type?: "columns" | "bars" }) {
  const desiredN = 30
  const data = windowed(props.data, desiredN)

  return (
    <div className="codeflare--sparkline" data-index={0} data-type={props.type}>
      <Sparklines data={data} limit={desiredN} width={100} height={20} margin={0} preserveAspectRatio="xMinYMid meet">
        {props.type === "bars" ? <SparklinesBars height={10} barWidth={2.5} /> : <SparklinesLine />}
        {props.type === "bars" && <SparklinesReferenceLine type={SparklinesReferenceLineTypes.mean} />}
      </Sparklines>
    </div>
  )
}
