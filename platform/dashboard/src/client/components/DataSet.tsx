import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import GridCell from "./GridCell"

type Props = {
  dataset: number[]
}

export default class DataSet extends PureComponent<Props> {
  private get dataset() {
    return this.props.dataset || []
  }

  public override render() {
    return (
      <Flex direction={{ default: "column" }}>
        <Flex gap={{ default: "gapXs" }}>
          {this.dataset.map((_, index) => (
            <FlexItem key={index}>
              <GridCell type="data" />
            </FlexItem>
          ))}
        </Flex>

        <strong>DataSet</strong>
      </Flex>
    )
  }
}
