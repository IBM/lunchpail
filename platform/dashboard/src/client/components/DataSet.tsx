import { PureComponent } from "react"
import { Card, CardBody, CardTitle, Flex, FlexItem } from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import GridCell, { GridTypeData } from "./GridCell"

export type Props = {
  idx: number
  label: string
  inbox: number
  outbox: number
}

function Work(props: { label: string; children: ReactElement }) {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
      <SmallLabel>{props.label}</SmallLabel>

      <Flex gap={{ default: "gapXs" }} style={{ maxWidth: "calc((4px + 1.375em) * 8 - 3px)" }}>
        {props.children}
      </Flex>
    </Flex>
  )
}

export default class DataSet extends PureComponent<Props> {
  private stack(model: Props["inbox"] | Props["outbox"], gridDataType: GridTypeData) {
    if (!model) {
      return <GridCell type="placeholder" dataset={this.props.idx} />
    }

    return Array(model || 0)
      .fill(0)
      .map((_, index) => (
        <FlexItem key={index}>
          <GridCell type={gridDataType} dataset={this.props.idx} />
        </FlexItem>
      ))
  }

  private inbox() {
    return this.stack(this.props.inbox, "inbox")
  }

  private outbox() {
    return this.stack(this.props.outbox, "outbox")
  }

  public override render() {
    return (
      <Card isCompact isPlain>
        <CardTitle component="h4">DataSet {this.props.label}</CardTitle>
        <CardBody>
          <Flex direction={{ default: "column" }}>
            <Work label="Unassigned Work">{this.inbox()}</Work>
            <Work label="Completed Work">{this.outbox()}</Work>
          </Flex>
        </CardBody>
      </Card>
    )
  }
}
