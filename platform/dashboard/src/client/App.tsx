import { Grid, GridItem } from "@patternfly/react-core";
import { DataSet, WorkerPoolModel, WorkerPool } from "./components";

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
const allWorkerPools = [randomWP, randomWP2];
// ##############################################################

export function App() {
  return (
    <div>
      <Grid hasGutter span={3} style={{ marginTop: "50px" }}>
        {/* In this section a DataSet component will be rendered on the left*/}
        <GridItem>
          <div>
            <DataSet />
          </div>
        </GridItem>
        {/* For each worker pool below, a 'WorkerPool' and 'Queue' component 
            will be rendered in it's own Grid section on the right*/}
        {allWorkerPools.map((w) => (
          <GridItem>
            <div>
              <WorkerPool model={w} />
            </div>
          </GridItem>
        ))}
      </Grid>
    </div>
  );
}

App.displayName = "Dashboard";
