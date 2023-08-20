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

import type EventSourceLike from "./events/EventSourceLike"
import type DataSetModel from "./components/DataSetModel"
import type WorkerPoolModel from "./components/WorkerPoolModel"

import "./App.scss"

type Props = {
  /** If `string`, then it will be interpreted as the route to the server-side EventSource */
  datasets: string | EventSourceLike

  /** If `string`, then it will be interpreted as the route to the server-side EventSource */
  workerpools: string | EventSourceLike
}

type State = {
  /** UI in dark mode? */
  useDarkMode: boolean

  /** EventSource for DataSets */
  datasetEvents: EventSourceLike

  /** EventSource for WorkerPools */
  workerpoolEvents: EventSourceLike

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

  private readonly onDataSetEvent = (revt: Event) => {
    const evt = revt as MessageEvent
    const datasets = JSON.parse(evt.data) as DataSetModel[]
    const datasetIndex = datasets.reduce(
      (M, { label }, idx) => {
        M[label] = idx
        return M
      },
      {} as State["datasetIndex"],
    )

    this.setState({ datasets, datasetIndex })
  }

  private readonly onWorkerPoolEvent = (revt: Event) => {
    const evt = revt as MessageEvent
    const workerpools = JSON.parse(evt.data) as WorkerPoolModel[]
    this.setState({ workerpools })
  }

  private initDataSetStream() {
    const source =
      typeof this.props.datasets === "string"
        ? new EventSource(this.props.datasets, { withCredentials: true })
        : this.props.datasets
    source.addEventListener("message", this.onDataSetEvent, false)
    source.addEventListener("error", console.error) // TODO
    return source
  }

  private initWorkerPoolStream() {
    const source =
      typeof this.props.workerpools === "string"
        ? new EventSource(this.props.workerpools, { withCredentials: true })
        : this.props.workerpools
    source.addEventListener("message", this.onWorkerPoolEvent, false)
    source.addEventListener("error", console.error) // TODO
    return source
  }

  public componentWillUnmount() {
    this.state?.datasetEvents?.removeEventListener("message", this.onDataSetEvent)
    this.state?.workerpoolEvents?.removeEventListener("message", this.onWorkerPoolEvent)
    this.state?.datasetEvents?.close()
    this.state?.workerpoolEvents?.close()
  }

  public componentDidMount() {
    this.setState({
      useDarkMode: true,
      datasets: [],
      workerpools: [],
      datasetIndex: {},
    })

    // hmm, avoid some races, do this second
    setTimeout(() =>
      this.setState({
        datasetEvents: this.initDataSetStream(),
        workerpoolEvents: this.initWorkerPoolStream(),
      }),
    )
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
      <Bullseye className="codeflare--body">
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
