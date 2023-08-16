import { Fragment, PureComponent } from "react"
import {
  Bullseye,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Switch,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
} from "@patternfly/react-core"

import DataSet, { Props as DataSetProps } from "./components/DataSet"
import WorkerPool, { WorkerPoolModel } from "./components/WorkerPool"

import "./App.scss"

type Props = undefined
type State = {
  /** UI in dark mode? */
  useDarkMode: boolean

  /** DataSet models */
  datasets: DataSetProps[]

  /** Map DataSetProps.label to a dense index */
  datasetIndex: Record<string, number>

  /** WorkerPool models */
  workerpools: WorkerPoolModel[]
}

export class App extends PureComponent<Props, State> {
  private readonly toggleDarkMode = () =>
    this.setState((curState) => {
      const useDarkMode = !curState?.useDarkMode
      if (useDarkMode) document.querySelector("html").classList.add("pf-v5-theme-dark")
      else document.querySelector("html").classList.remove("pf-v5-theme-dark")

      return { useDarkMode }
    })

  public async componentDidMount() {
    const datasets = await fetch("/datasets").then((response) => response.json())
    const workerpools = await fetch("/workerpools").then((response) => response.json())

    this.setState({
      useDarkMode: true,
      datasets,
      workerpools,
      datasetIndex: datasets.reduce((M, { label }, idx) => {
        M[label] = idx
        return M
      }, {}),
    })
  }

  public render() {
    const nCols = (this.state?.workerpools?.length || 0) + 1

    return (
      <Flex direction={{ default: "column" }} style={{ height: "100%" }}>
        <FlexItem flex={{ default: "flex_1" }}>
          <Bullseye className="codeflare--dashboard">
            <Grid hasGutter style={{ gridTemplateColumns: "10em 1fr 1fr" }}>
              {this.state?.datasets?.map((dataset, idx) => (
                <Fragment key={dataset.label}>
                  <GridItem span={1} style={{ justifySelf: "end", alignSelf: "start" }}>
                    <strong>DataSet {dataset.label}</strong>
                    <div className="codeflare--text-xs">Unassigned Work</div>
                  </GridItem>
                  <GridItem span={nCols - 1}>
                    <DataSet idx={idx} label={dataset.label} inbox={dataset.inbox} outbox={dataset.outbox} />
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
                      <WorkerPool model={w} datasetIndex={this.state.datasetIndex} />
                    </FlexItem>
                  ))}
                </Flex>
              </GridItem>
            </Grid>
          </Bullseye>
        </FlexItem>

        <Toolbar>
          <ToolbarContent>
            <ToolbarItem align={{ default: "alignRight" }}>
              <Switch label="Dark Mode" isChecked={this.state?.useDarkMode} onChange={this.toggleDarkMode} />
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </Flex>
    )
  }
}
