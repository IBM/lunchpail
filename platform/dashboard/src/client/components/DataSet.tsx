import { PureComponent } from "react"
import { Flex, FlexItem } from "@patternfly/react-core"

import GridCell from "./GridCell"

export class DataSet extends PureComponent {
  // ##############################################################
  // DELETE LATER: hard coding DataSet data to see UI
  dataset = Array(30).fill(1)

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
