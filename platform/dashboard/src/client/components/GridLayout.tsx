import { Component } from "react";
import { Flex, FlexItem } from "@patternfly/react-core";
import { Queue } from "./index";

type Props = {
  queueNum: number;
  queueLength: number;
  queueStatus: string;
};

/** Each item grid is a Queue component. Each Queue will be printed on its own column */
export class GridLayout extends Component<Props> {
  public labelForQueue() {
    return <p>Q{this.props.queueNum.toString()}</p>;
  }

  public isEmpty() {
    if (this.props.queueLength == 0) {
      return <p> Empty</p>;
    }
  }

  public override render() {
    return (
      <>
        <Flex>
          {this.isEmpty()}
          <FlexItem>
            <Queue
              queueStatus={this.props.queueStatus}
              queueLength={this.props.queueLength}
            />
            {this.labelForQueue()}
          </FlexItem>
        </Flex>
      </>
    );
  }
}
