import { Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "../SmallLabel"
import Cells, { Props as CellsProps } from "./Cells"

type Props = CellsProps & {
  queueNum: number
}

function Name(props: Pick<Props, "queueNum">) {
  return (
    <SmallLabel size="xxs" align="right">
      {props.queueNum}
    </SmallLabel>
  )
}

const gapXs = { default: "gapXs" as const }
const alignItemsCenter = { default: "alignItemsCenter" as const }

/**
 * Render one "row" of `Cells`, e.g. for one worker. Right now, this
 * is rendered horizontally.
 */
export default function GridLayout(props: Props) {
  return (
    <Flex gap={gapXs} alignItems={alignItemsCenter} className="codeflare--workqueues-row">
      <FlexItem className="codeflare--workqueues-cell">
        <Name queueNum={props.queueNum} />
      </FlexItem>

      <FlexItem className="codeflare--workqueues-cell">
        <Cells inbox={props.inbox} taskqueueIndex={props.taskqueueIndex} />
      </FlexItem>
    </Flex>
  )
}
