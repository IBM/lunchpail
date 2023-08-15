import { PureComponent } from "react"
import { Bullseye, Flex, FlexItem } from "@patternfly/react-core"

import DataSet, { Props as DataSetProps } from "./components/DataSet"
import WorkerPool, { WorkerPoolModel } from "./components/WorkerPool"

type Props = undefined
type State = {
  /** DataSet model */
  dataset: DataSetProps

  /** WorkerPool models */
  workerpools: WorkerPoolModel[]
}

export class App extends PureComponent<Props, State> {
  public async componentDidMount() {
    const dataset = await fetch("/dataset", {
      method: "GET",
    }).then((response) => response.json())

    const workerpools = await fetch("/workerPools", {
      method: "GET",
    }).then((response) => response.json())

    this.setState({
      dataset,
      workerpools,
    })
  }

  public render() {
    return (
      <Bullseye>
        <Flex alignItems={{ default: "alignItemsFlexEnd" }}>
          {/* In this section a DataSet component will be rendered on the left*/}
          <Flex>
            <DataSet inbox={this.state?.dataset.inbox} outbox={this.state?.dataset.outbox} />
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
