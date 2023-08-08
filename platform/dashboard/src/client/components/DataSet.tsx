import { Component } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import { BoxStyle } from "../style";

export class DataSet extends Component {
  // ##############################################################
  // DELETE LATER: hard coding DataSet data to see UI
  dataset = Array(30).fill(1);

  public override render() {
    return (
      <>
        <Flex>
          {this.dataset.map((_, index) => (
            <FlexItem key={index}>
              <div style={BoxStyle("pink")}>D{(index += 1)}</div>
            </FlexItem>
          ))}
        </Flex>
        <text style={{ marginLeft: "40%" }}>DataSet</text>
      </>
    );
  }
}
