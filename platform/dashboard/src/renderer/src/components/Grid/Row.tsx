import { Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "../SmallLabel"

import Cells from "./Cells"
import { type CellKind } from "./Cell"

type Props = {
  /** Label for the row */
  label: number | string

  count1: number
  kind1: CellKind
  count2: number
  kind2: CellKind
  count3: number
  kind3: CellKind
}

function Name(props: Pick<Props, "label">) {
  return (
    <SmallLabel size="xxs" align="right">
      <strong>{props.label}</strong>
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
        <Name label={props.label} />
      </FlexItem>

      <FlexItem className="codeflare--workqueues-cell">
        {props.count1 > 0 && <Cells count={props.count1} kind={props.kind1} />}
        {props.count2 > 0 && <Cells count={props.count2} kind={props.kind2} />}
        {props.count3 > 0 && <Cells count={props.count3} kind={props.kind3} />}
      </FlexItem>
    </Flex>
  )
}
