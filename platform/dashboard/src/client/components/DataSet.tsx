import { PropsWithChildren, PureComponent } from "react"
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  DescriptionList,
  DescriptionListTerm,
  DescriptionListGroup,
  DescriptionListDescription,
} from "@patternfly/react-core"

import SmallLabel from "./SmallLabel"
import type DataSetModel from "./DataSetModel"
import GridCell, { GridTypeData } from "./GridCell"

type Props = DataSetModel & {
  idx: number
}

function Work(props: PropsWithChildren<{ label: string; count: number }>) {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        <SmallLabel count={props.count}>{props.label}</SmallLabel>
      </DescriptionListTerm>

      <DescriptionListDescription>
        <Flex
          gap={{ default: "gapXs" }}
          flexWrap={{ default: "nowrap" }}
          style={{ width: "calc((4px + 1.375em) * 8 - 3px)", alignContent: "flex-start", overflow: "hidden" }}
        >
          {props.children}
        </Flex>
      </DescriptionListDescription>
    </DescriptionListGroup>
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

  private unassigned() {
    return this.stack(this.props.inbox, "unassigned")
  }

  private outbox() {
    return this.stack(this.props.outbox, "outbox")
  }

  public override render() {
    return (
      <Card isCompact isPlain>
        <CardTitle component="h4">DataSet {this.props.label}</CardTitle>
        <CardBody>
          <DescriptionList>
            <Work label="Unassigned Work" count={this.props.inbox}>
              {this.unassigned()}
            </Work>
            <Work label="Completed Work" count={this.props.outbox}>
              {this.outbox()}
            </Work>
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
