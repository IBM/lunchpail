import { Link } from "react-router-dom"

import { Split, SplitItem, Stack, StackItem, ToolbarItem } from "@patternfly/react-core"

import Base, { BaseState } from "./pages/Base"

import DataSet from "./components/DataSet"
import WorkerPool from "./components/WorkerPool"

import type EventSourceLike from "./events/EventSourceLike"
import type QueueEvent from "./components/WorkerPoolModel"
import type DataSetModel from "./components/DataSetModel"
import type { WorkerPoolModel, WorkerPoolModelWithHistory } from "./components/WorkerPoolModel"
import { SidebarContent } from "./pages/SidebarContent"

import "./App.scss"
import "@patternfly/react-core/dist/styles/base.css"

type Props = {
  /** If `string`, then it will be interpreted as the route to the server-side EventSource */
  datasets: string | EventSourceLike

  /** If `string`, then it will be interpreted as the route to the server-side EventSource */
  queues: string | EventSourceLike

  /** Route back to this page [default: /] */
  route?: string
}

type State = BaseState & {
  /** EventSource for DataSets */
  datasetSource: EventSourceLike

  /** EventSource for Queues */
  queueSource: EventSourceLike

  /** Events for DataSets, indexed by DataSetModel.label */
  datasetEvents: Record<string, DataSetModel[]>

  /** Events for Queues, indexed by WorkerPoolModel.label */
  queueEvents: Record<string, QueueEvent[]>

  /** Map DataSetModel.label to a dense index */
  datasetIndex: Record<string, number>

  /** Map WorkerPool label to a dense index */
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
    const datasetEvent = JSON.parse(evt.data) as DataSetModel
    const { label } = datasetEvent

    const datasetIndex = this.state?.datasetIndex || {}
    let myIdx = datasetIndex[label]
    if (myIdx === undefined) {
      myIdx = Object.keys(datasetIndex).length
      datasetIndex[label] = myIdx
    }

    const datasetEvents = Object.assign({}, this.state?.datasetEvents || {})
    if (!(label in datasetEvents)) {
      datasetEvents[label] = []
    }
    datasetEvents[label].push(datasetEvent)

    this.setState({ datasetEvents, datasetIndex })
  }

  private readonly onQueueEvent = (revt: Event) => {
    const evt = revt as MessageEvent
    const queueEvent = JSON.parse(evt.data) as QueueEvent
    const { workerpool } = queueEvent

    const workerpoolIndex = this.state?.workerpoolIndex || {}
    let myIdx = workerpoolIndex[workerpool]
    if (myIdx === undefined) {
      myIdx = Object.keys(workerpoolIndex).length
      workerpoolIndex[workerpool] = myIdx
    }

    const queueEvents = Object.assign({}, this.state?.queueEvents || {})
    if (!(workerpool in queueEvents)) {
      queueEvents[workerpool] = []
    }

    const myEvents = queueEvents[workerpool]
    if (myEvents.length > 0 && myEvents[myEvents.length - 1].timestamp === queueEvent.timestamp) {
      // hmm, debounce
      return
    }

    queueEvents[workerpool].push(queueEvent)

    this.setState({ queueEvents, workerpoolIndex })
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

  private initQueueStream() {
    const source =
      typeof this.props.queues === "string"
        ? new EventSource(this.props.queues, { withCredentials: true })
        : this.props.queues
    source.addEventListener("message", this.onQueueEvent, false)
    source.addEventListener("error", console.error) // TODO
    return source
  }

  public componentWillUnmount() {
    this.state?.datasetSource?.removeEventListener("message", this.onDataSetEvent)
    this.state?.queueSource?.removeEventListener("message", this.onQueueEvent)
    this.state?.datasetSource?.close()
    this.state?.queueSource?.close()
  }

  public componentDidMount() {
    this.setState({
      datasetEvents: {},
      queueEvents: {},
      datasetIndex: {},
      workerpoolIndex: {},
    })

    // hmm, avoid some races, do this second
    setTimeout(() =>
      this.setState({
        datasetSource: this.initDataSetStream(),
        queueSource: this.initQueueStream(),
      }),
    )
  }

  private lexico = (a: [string, unknown], b: [string, unknown]) => a[0].localeCompare(b[0])
  private lexicoWP = (a: WorkerPoolModel, b: WorkerPoolModel) => a.label.localeCompare(b.label)

  private datasets() {
    return (
      <Stack hasGutter className="codeflare--flex-stack">
        {Object.entries(this.state?.datasetEvents || {})
          .sort(this.lexico)
          .map(([label, events], idx) => (
            <StackItem key={label}>
              <DataSet
                idx={idx}
                label={label}
                inbox={events[events.length - 1].inbox}
                inboxHistory={events.map((_) => _.inbox)}
                outboxHistory={events.map((_) => _.outbox)}
                timestamps={events.map((_) => _.timestamp)}
                outbox={events[events.length - 1].outbox}
              />
            </StackItem>
          ))}
      </Stack>
    )
  }

  private toWorkerPoolModel(label: string, queueEventsForOneWorkerPool: QueueEvent[]): WorkerPoolModelWithHistory {
    const model = queueEventsForOneWorkerPool.reduce(
      (M, queueEvent) => {
        if (!M.inbox[queueEvent.workerIndex]) {
          M.inbox[queueEvent.workerIndex] = {}
        }
        M.inbox[queueEvent.workerIndex][queueEvent.dataset] = queueEvent.inbox

        if (!M.outbox[queueEvent.workerIndex]) {
          M.outbox[queueEvent.workerIndex] = {}
        }
        M.outbox[queueEvent.workerIndex][queueEvent.dataset] = queueEvent.outbox

        if (!M.processing[queueEvent.workerIndex]) {
          M.processing[queueEvent.workerIndex] = {}
        }
        M.processing[queueEvent.workerIndex][queueEvent.dataset] = queueEvent.processing

        return M
      },
      { inbox: [], outbox: [], processing: [] } as Omit<WorkerPoolModel, "label">,
    )

    return {
      label,
      inbox: this.backfill(model.inbox),
      outbox: this.backfill(model.outbox),
      processing: this.backfill(model.processing),
      outboxHistory: queueEventsForOneWorkerPool.map((_) => _.outbox),
      timestamps: queueEventsForOneWorkerPool.map((_) => _.timestamp),
    }
  }

  private backfill<T extends WorkerPoolModel["inbox"] | WorkerPoolModel["outbox"] | WorkerPoolModel["processing"]>(
    A: T,
  ): T {
    for (let idx = 0; idx < A.length; idx++) {
      if (!(idx in A)) A[idx] = {}
    }
    return A
  }

  private get latestWorkerPoolModel(): WorkerPoolModelWithHistory[] {
    return Object.entries(this.state?.queueEvents || {})
      .map(([label, queueEventsForOneWorkerPool]) => {
        return this.toWorkerPoolModel(label, queueEventsForOneWorkerPool)
      })
      .sort(this.lexicoWP)
  }

  private maxNWorkers(model: WorkerPoolModel[]) {
    return model.reduce((max, wp) => Math.max(max, wp.inbox.length), 0)
  }

  private workerpools() {
    return (
      <Stack hasGutter className="codeflare--flex-stack">
        {this.latestWorkerPoolModel.map((w) => (
          <StackItem key={w.label}>
            <WorkerPool
              model={w}
              datasetIndex={this.state.datasetIndex}
              maxNWorkers={this.maxNWorkers(this.latestWorkerPoolModel)}
            />
          </StackItem>
        ))}
      </Stack>
    )
  }

  protected override sidebar() {
    return (
      <SidebarContent
        datasetNames={Object.keys(this.state?.datasetIndex || {})}
        workerpoolNames={Object.keys(this.state?.workerpoolIndex || {})}
      />
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
