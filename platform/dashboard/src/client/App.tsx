import { Fragment, PureComponent } from "react"
import { Bullseye, Flex, FlexItem, Grid, GridItem } from "@patternfly/react-core"

import DataSet, { Props as DataSetProps } from "./components/DataSet"
import WorkerPool, { WorkerPoolModel } from "./components/WorkerPool"

type Props = undefined
type State = {
  /** DataSet models */
  datasets: DataSetProps[]

  /** WorkerPool models */
  workerpools: WorkerPoolModel[]
}

export class App extends PureComponent<Props, State> {
  public async componentDidMount() {
    const datasets = await fetch("/datasets", {
      method: "GET",
    }).then((response) => response.json())

    const workerpools = await fetch("/workerpools", {
      method: "GET",
    }).then((response) => response.json())

    this.setState({
      datasets,
      workerpools,
    })
  }

  public render() {
    const nCols = (this.state?.workerpools?.length || 0) + 1

    return (
      <Bullseye>
        <Grid hasGutter style={{ gridTemplateColumns: "10em 1fr 1fr" }}>
          {this.state?.datasets?.map((dataset) => (
            <Fragment key={dataset.label}>
              <GridItem span={1} style={{ justifySelf: "end" }}>
                <strong>DataSet {dataset.label}</strong>
              </GridItem>
              <GridItem span={nCols - 1}>
                <DataSet label={dataset.label} inbox={dataset.inbox} outbox={dataset.outbox} />
              </GridItem>
            </Fragment>
          ))}

          {/* For each worker pool below, a 'WorkerPool' and 'Queue' component 
              will be rendered in it's own Grid section on the right*/}
          <GridItem span={1} />

          <GridItem span={nCols - 1}>
            <Flex alignItems={{ default: "alignItemsFlexEnd" }}>
              {this.state?.workerpools?.map((w) => (
                <FlexItem key={w.label}>
                  <WorkerPool model={w} />
                </FlexItem>
              ))}
            </Flex>
          </GridItem>
        </Grid>
      </Bullseye>
    )
  }
}
