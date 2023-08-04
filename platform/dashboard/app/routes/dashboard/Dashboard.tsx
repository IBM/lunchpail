/* SPDX-FileCopyrightText: 2014-present Kriasoft */
/* SPDX-License-Identifier: MIT */

import { Box, Grid } from "@mui/material";
import {
  DataSet,
  Queue,
  WorkerPoolModel,
  WorkerPool,
} from "../../eda/index.tsx";

// ##############################################################
// DELETE LATER: hard coding some WorkerPool data to see UI
const randomWP: WorkerPoolModel = {
  sizeInbox: [1, 2, 3, 4, 5],
  sizeOutbox: Array(2).fill(2),
  status: "completed",
  numTiles: 1,
  startTime: 1,
  numTilesProcessed: 1,
  label: "A",
};
const randomWP2: WorkerPoolModel = {
  sizeInbox: [5, 2, 3, 4, 1, 1, 2, 3, 4],
  sizeOutbox: Array(2).fill(2),
  status: "completed",
  numTiles: 1,
  startTime: 1,
  numTilesProcessed: 1,
  label: "B",
};
// ##############################################################

export function Component() {
  return (
    <>
      <Grid container direction="row" style={{ marginTop: "50px" }}>
        <Grid item xs={4}>
          <div>
            <DataSet />
          </div>
        </Grid>
        <Grid item xs={4}>
          <div>
            <WorkerPool model={randomWP} />
          </div>
        </Grid>
        <Grid item xs={4}>
          <div>
            <WorkerPool model={randomWP2} />
          </div>
        </Grid>
      </Grid>
    </>
  );
}

Component.displayName = "Dashboard";
