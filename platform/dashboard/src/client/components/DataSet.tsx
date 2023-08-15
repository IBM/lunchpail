import { PureComponent } from "react"
import { Flex, FlexItem, Grid, GridItem } from "@patternfly/react-core"

import GridCell, { GridTypeData } from "./GridCell"

export type Props = {
  idx: number
  label: string
  inbox: number
  outbox: number
}

export default class DataSet extends PureComponent<Props> {
  private stack(model: Props["inbox"] | Props["outbox"], gridDataType: GridTypeData) {
    return model === 0 ? (
      <div style={{ fontStyle: "italic", fontSize: "0.75em" }}>Empty</div>
    ) : (
      <Flex gap={{ default: "gapXs" }} style={{ maxWidth: "calc((4px + 1.375em) * 8 - 3px)" }}>
        {Array(model || 0)
          .fill(0)
          .map((_, index) => (
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
      <Grid style={{ gridTemplate: '"L1 L2" "G1 G2"' }}>
        {this.props.idx === 0 && <GridItem style={{ gridArea: "L1", fontSize: "0.75em" }}>Inbox</GridItem>}
        {this.props.idx === 0 && (
          <GridItem style={{ gridArea: "L2", fontSize: "0.75em", marginLeft: "4px" }}>Outbox</GridItem>
        )}

        <GridItem style={{ gridArea: "G1" }}>{this.inbox()}</GridItem>
        <GridItem style={{ gridArea: "G2", marginLeft: "4px" }}>{this.outbox()}</GridItem>
      </Grid>
    )
  }
}
