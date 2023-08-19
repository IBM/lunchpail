import { PureComponent } from "react"
import {
  Bullseye,
  Flex,
  FlexItem,
  Switch,
  Masthead,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core"

import DataSet from "./components/DataSet"
import WorkerPool from "./components/WorkerPool"

import type DataSetModel from "./components/DataSetModel"
import type WorkerPoolModel from "./components/WorkerPoolModel"

import "./App.scss"

type Props = unknown
type State = {
  /** UI in dark mode? */
  useDarkMode: boolean

  /** DataSet models */
  datasets: DataSetModel[]

  /** Map DataSetProps.label to a dense index */
  datasetIndex: Record<string, number>

  /** WorkerPool models */
  workerpools: WorkerPoolModel[]
}

export class App extends PureComponent<Props, State> {
  private readonly toggleDarkMode = () =>
    this.setState((curState) => {
      const useDarkMode = !curState?.useDarkMode
      if (useDarkMode) document.querySelector("html")?.classList.add("pf-v5-theme-dark")
      else document.querySelector("html")?.classList.remove("pf-v5-theme-dark")

      return { useDarkMode }
    })

  public async componentDidMount() {
    const datasets = (await fetch("/datasets").then((response) => response.json())) as DataSetModel[]
    const workerpools = (await fetch("/workerpools").then((response) => response.json())) as WorkerPoolModel[]

    this.setState({
      useDarkMode: true,
      datasets,
      workerpools,
      datasetIndex: datasets.reduce(
        (M, { label }, idx) => {
          M[label] = idx
          return M
        },
        {} as State["datasetIndex"],
      ),
    })
  }

  private datasets() {
    return (
      <Flex>
        {this.state?.datasets?.map((dataset, idx) => (
          <DataSet key={dataset.label} idx={idx} label={dataset.label} inbox={dataset.inbox} outbox={dataset.outbox} />
        ))}
      </Flex>
    )
  }

  private workerpools() {
    return (
      <Flex>
        {this.state?.workerpools?.map((w) => (
          <FlexItem key={w.label}>
            <WorkerPool model={w} datasetIndex={this.state.datasetIndex} />
          </FlexItem>
        ))}
      </Flex>
    )
  }

  private body() {
    return (
      <Bullseye>
        <Flex direction={{ default: "column" }}>
          {this.datasets()}
          {this.workerpools()}
        </Flex>
      </Bullseye>
    )
  }

  private header() {
    return (
      <Masthead>
        <MastheadMain>
          <MastheadBrand>Queueless Dashboard</MastheadBrand>
        </MastheadMain>

        <MastheadContent>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem align={{ default: "alignRight" }}>
                <Switch label="Dark Mode" isChecked={this.state?.useDarkMode} onChange={this.toggleDarkMode} />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </MastheadContent>
      </Masthead>
    )
  }

  public render() {
    return (
      <Flex direction={{ default: "column" }} style={{ height: "100%" }}>
        {this.header()}
        <FlexItem flex={{ default: "flex_1" }}>{this.body()}</FlexItem>
      </Flex>
    )
  }
}
