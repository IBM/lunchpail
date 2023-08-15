import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import GridCell, { GridTypeData } from "./GridCell"

export type Props = {
  label: string
  inbox: number[]
  outbox: number[]
}

export default class DataSet extends PureComponent<Props> {
  private stack(model: Props["inbox"] | Props["outbox"], gridDataType: GridTypeData) {
    return (
      <Flex gap={{ default: "gapXs" }} style={{ maxWidth: "calc((4px + 1.375em) * 8 - 3px)" }}>
        {(model || []).map((_, index) => (
          <FlexItem key={index}>
            <GridCell type={gridDataType} />
          </FlexItem>
        ))}
      </Flex>
    )
  }

  private inbox() {
    return this.stack(this.props.inbox, "inbox")
  }

  private outbox() {
    return this.stack(this.props.outbox, "outbox")
  }

  public override render() {
    return (
      <Flex alignItems={{ default: "alignItemsFlexStart" }}>
        <Flex gap={{ default: "gapXs" }}>
          {this.inbox()}
          {this.outbox()}
        </Flex>
      </Flex>
    )
  }
}
