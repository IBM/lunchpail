import { Component } from "react";
import { Box, Grid } from "@mui/material";
import { GridLayout } from "./index.tsx";

export interface WorkerPoolModel {
  sizeInbox: number[];
  sizeOutbox: number[];
  status: string; // "unknown" | "pending" | "completed" | "error" | "running"
  numTiles: number;
  startTime: number;
  numTilesProcessed: number;
  label: string;
}

interface props {
  model: WorkerPoolModel;
}

export class WorkerPool extends Component<props> {
  public wpLabel() {
    return (
      <text style={{ marginLeft: "10%" }}>
        WorkerPool {this.props.model.label}
      </text>
    );
  }

  public isEmpty(numArr: number[]) {
    if (numArr.length == 0) {
      return <text>Waiting for queues...</text>;
    }
  }

  public override render() {
    const inboxArr = this.props.model.sizeInbox;
    // console.log("Worker: ", { inboxArr }); // FOR DEBUGGING
    return (
      <>
        {/* This is the inbox, or "grid" of queues, which come from the particular WorkerPool data */}
        {this.isEmpty(inboxArr)}
        <Grid container style={{ marginTop: "2%" }}>
          {inboxArr.map((_, i) => (
            <GridLayout
              queueNum={i + 1}
              queueLength={inboxArr[i]}
              queueStatus={this.props.model.status}
            />
          ))}
        </Grid>
        <text style={{ marginLeft: "10%" }}>Inbox</text>
        <br />
        {/* This is the grid that contains the particular WorkerPool data */}
        <Grid container style={{ marginTop: "20%" }} spacing={0.5}>
          {inboxArr.map((_, index) => (
            <Grid item xs="auto" key={index}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "lightBlue",
                  opacity: [0.9, 0.8, 0.7],
                  "&:hover": {
                    backgroundColor: "primary.dark",
                    opacity: [0.9, 0.8, 0.7],
                  },
                }}
              >
                D{(index += 1)}
              </Box>
            </Grid>
          ))}
        </Grid>
        {this.wpLabel()}
      </>
    );
  }
}
