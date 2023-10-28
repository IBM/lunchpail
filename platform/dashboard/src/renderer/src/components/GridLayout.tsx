import { Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import Queue, { Props as QueueProps } from "./Queue"

type Props = QueueProps & {
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

/** Each item grid is a Queue component. Each Queue will be printed on its own column */
export default function GridLayout(props: Props) {
  /* private count(model: Props["inbox"]) {
    return Object.values(model).reduce((sum, depth) => sum + depth, 0)
  } */

  /* private get nIn() {
    return this.count(this.props.inbox)
  } */

  return (
    <Flex gap={gapXs} alignItems={alignItemsCenter} className="codeflare--workqueues-row">
      <FlexItem className="codeflare--workqueues-cell">
        <Name queueNum={props.queueNum} />
      </FlexItem>

      <FlexItem className="codeflare--workqueues-cell">
        <Queue inbox={props.inbox} datasetIndex={props.datasetIndex} gridTypeData="plain" />
      </FlexItem>
    </Flex>
  )
}
