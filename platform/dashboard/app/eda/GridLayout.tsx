import { Component } from "react";
import { Grid } from "@mui/material";
import { Queue } from "./index.tsx";

type Props = {
  queueNum: number;
  queueLength: number;
  queueStatus: string;
};

/** Each item grid is a Queue component. Each Queue will be printed on its own column */
export class GridLayout extends Component<Props> {
  public labelForQueue() {
    return <text>Q#{this.props.queueNum.toString()}</text>;
  }

  public isEmpty() {
    if (this.props.queueLength == 0) {
      return <text> Empty</text>;
    }
  }

  public override render() {
    return (
      <>
        <Grid item xs={false}>
          {this.isEmpty()}
          <Queue
            queueStatus={this.props.queueStatus}
            queueLength={this.props.queueLength}
          />
          {this.labelForQueue()}
        </Grid>
      </>
    );
  }
}
