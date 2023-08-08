import { PureComponent } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import { BoxStyle } from "../style";

export class DataSet extends PureComponent {
  // ##############################################################
  // DELETE LATER: hard coding DataSet data to see UI
  dataset = Array(30).fill(1);

  public override render() {
    return (
      <>
        <Flex gap={{ default: 'gapXs' }}>
          {this.dataset.map((_, index) => (
            <FlexItem key={index}>
              <div style={BoxStyle("#FC6769")}></div>
            </FlexItem>
          ))}
        </Flex>

        <strong>DataSet</strong>
      </>
    );
  }
}
