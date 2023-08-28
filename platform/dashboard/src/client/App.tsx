import { Link } from "react-router-dom"

import { Split, SplitItem, Stack, StackItem, ToolbarItem } from "@patternfly/react-core"

import Base, { BaseState } from "./pages/Base"

import DataSet from "./components/DataSet"
import WorkerPool from "./components/WorkerPool"

import type EventSourceLike from "./events/EventSourceLike"
import type DataSetModel from "./components/DataSetModel"
import type WorkerPoolModel from "./components/WorkerPoolModel"

import "./App.scss"
import "@patternfly/react-core/dist/styles/base.css"

type Props = {
  /** If `string`, then it will be interpreted as the route to the server-side EventSource */
  datasets: string | EventSourceLike

  /** If `string`, then it will be interpreted as the route to the server-side EventSource */
  workerpools: string | EventSourceLike

  /** Route back to this page [default: /] */
  route?: string
}

type State = BaseState & {
  /** EventSource for DataSets */
  datasetEvents: EventSourceLike

  /** EventSource for WorkerPools */
  workerpoolEvents: EventSourceLike

  /** DataSet models */
  datasets: DataSetModel[]

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>

  /** WorkerPool models */
  workerpools: WorkerPoolModel[]

  /** Map WorkerPoolModel.label to a dense index */
  workerpoolIndex: Record<string, number>
}

export function intervalParam(): number {
  const queryParams = new URLSearchParams(window.location.search)
  const interval = queryParams.get("interval")
  return interval ? parseInt(interval) : 2000
}

export class App extends Base<Props, State> {
  private readonly onDataSetEvent = (revt: Event) => {
    const evt = revt as MessageEvent
    const dataset = JSON.parse(evt.data) as DataSetModel

    const datasetIndex = this.state?.datasetIndex || {}
    let myIdx = datasetIndex[dataset.label]
    if (myIdx === undefined) {
      myIdx = Object.keys(datasetIndex).length
      datasetIndex[dataset.label] = myIdx
    }

    const datasets = (this.state?.datasets || []).slice(0)
    datasets[myIdx] = dataset

    this.setState({ datasets, datasetIndex })
  }

  private readonly onWorkerPoolEvent = (revt: Event) => {
    const evt = revt as MessageEvent
    const workerpool = JSON.parse(evt.data) as WorkerPoolModel

    const workerpoolIndex = this.state?.workerpoolIndex || {}
    let myIdx = workerpoolIndex[workerpool.label]
    if (myIdx === undefined) {
      myIdx = Object.keys(workerpoolIndex).length
      workerpoolIndex[workerpool.label] = myIdx
    }

    const workerpools = (this.state?.workerpools || []).slice(0)
    workerpools[myIdx] = workerpool

    this.setState({ workerpools, workerpoolIndex })
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
      workerpoolIndex: {},
    })

    // hmm, avoid some races, do this second
    setTimeout(() =>
      this.setState({
        datasetEvents: this.initDataSetStream(),
        workerpoolEvents: this.initWorkerPoolStream(),
      }),
    )
  }

  private lexico = (a: DataSetModel, b: DataSetModel) => a.label.localeCompare(b.label)

  private datasets() {
    return (
      <Stack>
        {this.state?.datasets
          ?.slice()
          .sort(this.lexico)
          .map((dataset, idx) => (
            <StackItem key={dataset.label}>
              <DataSet idx={idx} label={dataset.label} inbox={dataset.inbox} outbox={dataset.outbox} />
            </StackItem>
          ))}
      </Stack>
    )
  }

  private get maxNWorkers() {
    return this.state?.workerpools?.reduce((max, wp) => Math.max(max, wp.inbox.length), 0)
  }

  private workerpools() {
    return (
      <Stack>
        {this.state?.workerpools?.map((w) => (
          <StackItem key={w.label}>
            <WorkerPool model={w} datasetIndex={this.state.datasetIndex} maxNWorkers={this.maxNWorkers} />
          </StackItem>
        ))}
      </Stack>
    )
  }

  protected override body() {
    return (
      <Split hasGutter className="codeflare--body">
        <SplitItem>{this.datasets()}</SplitItem>
        <SplitItem>{this.workerpools()}</SplitItem>
      </Split>
    )
  }

  /*  private readonly newpool = () => {
    fetch()
  }*/

  private addWorkerPoolButton() {
    return <Link to={`/newpool?returnto=${encodeURIComponent(this.props.route || "/")}`}>Add Worker Pool</Link>
  }

  protected override footerRight() {
    return <ToolbarItem>{this.addWorkerPoolButton()}</ToolbarItem>
  }
}
