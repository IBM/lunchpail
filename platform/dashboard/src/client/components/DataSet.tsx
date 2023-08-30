import { Sparklines, SparklinesLine } from "react-sparklines-typescript-v2"
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

import "./Queue.scss"
import "./Sparkline.scss"

type Props = DataSetModel & {
  idx: number
  inboxHistory: number[]
}

function Work(
  props: PropsWithChildren<Pick<Props, "idx"> & { label: string; count: number; history: Props["inboxHistory"] }>,
) {
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        <SmallLabel count={props.count}>{props.label}</SmallLabel>
      </DescriptionListTerm>

      <DescriptionListDescription>
        <Flex
          className="codeflare--workqueue"
          gap={{ default: "gapXs" }}
          flexWrap={{ default: "nowrap" }}
          style={{ width: "calc((4px + 1.375em) * 8 - 3px)", alignContent: "flex-start", overflow: "hidden" }}
        >
          {props.children}
        </Flex>

        {props.history.length > 0 && (
          <div className="codeflare--sparkline" data-dataset={props.idx}>
            <Sparklines data={props.history} limit={30} width={100} height={20} margin={5}>
              <SparklinesLine />
            </Sparklines>
          </div>
        )}
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
            <Work
              label="Unassigned Work"
              count={this.props.inbox}
              idx={this.props.idx}
              history={this.props.inboxHistory}
            >
              {this.unassigned()}
            </Work>

            <Work label="Completed Work" count={this.props.outbox} idx={this.props.idx} history={[]}>
              {this.outbox()}
            </Work>
          </DescriptionList>
        </CardBody>
      </Card>
    )
  }
}
