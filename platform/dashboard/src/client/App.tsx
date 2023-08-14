import { PureComponent } from "react"
import { Bullseye, Flex, FlexItem } from "@patternfly/react-core"

import DataSet, { DataSetProps } from "./components/DataSet"
import WorkerPool, { WorkerPoolModel } from "./components/WorkerPool"

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
}
const randomWP2: WorkerPoolModel = {
  sizeInbox: [5, 2, 3, 4, 1, 1, 2, 3, 4],
  sizeOutbox: Array(2).fill(2),
  status: "completed",
  numTiles: 1,
  startTime: 1,
  numTilesProcessed: 1,
  label: "B",
}
const randomData = Array(30).fill(1)
// ##############################################################

type Props = undefined
type State = {
  /** DataSet model */
  dataset: DataSetProps

  /** WorkerPool models */
  workerpools: WorkerPoolModel[]
}

export class App extends PureComponent<Props, State> {
  public componentDidMount() {
    this.setState({
      dataset: randomData,
      workerpools: [randomWP, randomWP2],
    })
  }

  public render() {
    return (
      <Bullseye>
        <Flex alignItems={{ default: "alignItemsFlexEnd" }}>
          {/* In this section a DataSet component will be rendered on the left*/}
          <Flex style={{ maxWidth: "8em" }}>
            <DataSet dataset={this.state?.dataset} />
          </Flex>

          {/* For each worker pool below, a 'WorkerPool' and 'Queue' component 
          will be rendered in it's own Grid section on the right*/}
          <Flex
            flex={{ default: "flex_1" }}
            alignItems={{ default: "alignItemsFlexEnd" }}
            flexWrap={{ default: "wrap" }}
          >
            {this.state?.workerpools?.map((w) => (
              <FlexItem key={w.label}>
                <WorkerPool model={w} />
              </FlexItem>
            ))}
          </Flex>
        </Flex>
      </Bullseye>
    )
  }
}
