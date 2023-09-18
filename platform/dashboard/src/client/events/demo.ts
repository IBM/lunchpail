import { uniqueNamesGenerator, animals } from "unique-names-generator"

import type NewPoolHandler from "./NewPoolHandler"
import type EventSourceLike from "../events/EventSourceLike.js"
import type QueueEvent from "../events/QueueEvent.js"
import type WorkerPoolStatusEvent from "../events/WorkerPoolStatusEvent.js"
import type ApplicationSpecEvent from "../events/ApplicationSpecEvent.js"
import type DataSetModel from "../components/DataSetModel.js"
import { intervalParam } from "../pages/Dashboard.js"

type DemoWorkerPool = {
  name: string
  numWorkers: number
  applications: string[]
  datasets: string[]
  inboxes: number[]
  outboxes: number[]
  processing: number[]
}

const ns = "ns"
const runs = ["R1"]
const applications = Array(1)
  .fill(0)
  .map(() => uniqueNamesGenerator({ dictionaries: [animals] }))

function randomQueueEvent(
  workerpool: DemoWorkerPool,
  inboxIncr: number,
  outboxIncr: number,
  processingIncr: number,
): QueueEvent {
  const nWorkers = workerpool.numWorkers
  const workerIndex = Math.floor(Math.random() * nWorkers)
  const datasetIndex = Math.floor(Math.random() * workerpool.datasets.length)

  workerpool.inboxes[workerIndex] = Math.max(0, (workerpool.inboxes[workerIndex] || 0) + inboxIncr)
  workerpool.outboxes[workerIndex] = Math.max(0, (workerpool.outboxes[workerIndex] || 0) + outboxIncr)
  workerpool.processing[workerIndex] = Math.max(0, (workerpool.processing[workerIndex] || 0) + processingIncr)

  return {
    timestamp: Date.now(),
    run: runs[0], // TODO multiple demo runs?
    workerIndex,
    workerpool: workerpool.name,
    dataset: workerpool.datasets[datasetIndex],
    inbox: workerpool.inboxes[workerIndex],
    outbox: workerpool.outboxes[workerIndex],
    processing: workerpool.processing[workerIndex],
  }
}

function randomWorkerPoolStatusEvent(workerpool: DemoWorkerPool): WorkerPoolStatusEvent {
  const nWorkers = workerpool.numWorkers

  return {
    timestamp: Date.now(),
    ns,
    workerpool: workerpool.name,
    applications: workerpool.applications,
    nodeClass: "md",
    supportsGpu: false,
    age: "",
    status: "Running",
    ready: Math.round(Math.random() * nWorkers),
    size: nWorkers,
  }
}

function randomApplicationSpecEvent(application: string): ApplicationSpecEvent {
  return {
    timestamp: Date.now(),
    ns,
    api: "workqueue",
    image: "fakeimage",
    command: "python foo.py",
    application,
    supportsGpu: false,
    age: "",
  }
}

type Handler = (evt: MessageEvent) => void

export class DemoDataSetEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = intervalParam()) {}

  private readonly colors = ["blue", "green", "purple"]
  private readonly datasets: Omit<DataSetModel, "timestamp">[] = Array(3)
    .fill(0)
    .map((_, idx) => ({
      label: this.colors[idx],
      idx,
      inbox: 0,
      outbox: 0,
    }))

  public get sets(): readonly Omit<DataSetModel, "timestamp">[] {
    return this.datasets
  }

  private initInterval() {
    if (!this.interval) {
      const { datasets, handlers } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * datasets.length)
          const dataset = datasets[whichToUpdate]
          dataset.inbox++
          const model: DataSetModel = Object.assign({}, dataset, {
            timestamp: Date.now(),
            //inbox: ~~(Math.random() * 20),
            //outbox: ~~(Math.random() * 2),
          })
          handlers.forEach((handler) => handler(new MessageEvent("dataset", { data: JSON.stringify(model) })))
          return interval
        })(), // () means invoke the interval right away
        this.intervalMillis,
      )
    }
  }

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.handlers.push(handler)
      this.initInterval()
    }
  }

  public removeEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      const idx = this.handlers.findIndex((_) => _ === handler)
      if (idx >= 0) {
        this.handlers.splice(idx, 1)
      }
    }
  }

  public close() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

export class DemoQueueEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(
    private readonly pools: DemoWorkerPoolStatusEventSource,
    private readonly datasets: DemoDataSetEventSource,
    private readonly intervalMillis = 2000,
  ) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      const datasets = this.datasets.sets
      const workerpools = this.pools.pools

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * workerpools.length)
          const workerpool = workerpools[whichToUpdate]
          if (workerpool) {
            if (workerpool.numWorkers > 0) {
              // consume one into our inbox
              const inOutOrProcessing = Math.floor(Math.random() * 3)
              const inboxIncr = inOutOrProcessing === 0 ? 1 : inOutOrProcessing === 2 ? -1 : 0
              const outboxIncr = inOutOrProcessing === 1 ? 1 : 0
              const processingIncr = inOutOrProcessing === 2 ? 1 : inOutOrProcessing === 1 ? -1 : 0
              const model = randomQueueEvent(workerpool, inboxIncr, outboxIncr, processingIncr)
              const dataset = datasets.find((_) => _.label === model.dataset)
              if (dataset) {
                dataset.inbox = Math.max(0, dataset.inbox - inboxIncr)
                dataset.outbox = dataset.inbox + outboxIncr
                handlers.forEach((handler) => handler(new MessageEvent("dataset", { data: JSON.stringify(model) })))
              }
            }
          }
          return interval
        })(), // () means invoke the interval right away
        this.intervalMillis,
      )
    }
  }

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.handlers.push(handler)
      this.initInterval()
    }
  }

  public removeEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      const idx = this.handlers.findIndex((_) => _ === handler)
      if (idx >= 0) {
        this.handlers.splice(idx, 1)
      }
    }
  }

  public close() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

export class DemoWorkerPoolStatusEventSource implements EventSourceLike, NewPoolHandler {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  private readonly workerpools: DemoWorkerPool[] = []

  public constructor(private readonly intervalMillis = 2000) {}

  public get pools(): readonly DemoWorkerPool[] {
    return this.workerpools
  }

  private initInterval() {
    if (!this.interval) {
      const { handlers, workerpools } = this

      this.interval = setInterval(
        (function interval() {
          if (workerpools.length > 0) {
            const whichToUpdate = Math.floor(Math.random() * workerpools.length)
            const workerpool = workerpools[whichToUpdate]
            const model = randomWorkerPoolStatusEvent(workerpool)
            handlers.forEach((handler) => handler(new MessageEvent("pool", { data: JSON.stringify(model) })))
          }

          return interval
        })(), // () means invoke the interval right away
        this.intervalMillis,
      )
    }
  }

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.handlers.push(handler)
      this.initInterval()
    }
  }

  public removeEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      const idx = this.handlers.findIndex((_) => _ === handler)
      if (idx >= 0) {
        this.handlers.splice(idx, 1)
      }
    }
  }

  public close() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  public newPool(...params: Parameters<NewPoolHandler["newPool"]>) {
    const values = params[0]

    this.workerpools.push({
      name: values.poolName,
      numWorkers: parseInt(values.count, 10),
      applications: [values.application],
      datasets: [values.dataset],
      inboxes: [],
      outboxes: [],
      processing: [],
    })
  }
}

export class DemoApplicationSpecEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = 2000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * applications.length)
          const application = applications[whichToUpdate]
          const model = randomApplicationSpecEvent(application)
          handlers.forEach((handler) => handler(new MessageEvent("application", { data: JSON.stringify(model) })))
          return interval
        })(), // () means invoke the interval right away
        this.intervalMillis,
      )
    }
  }

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.handlers.push(handler)
      this.initInterval()
    }
  }

  public removeEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      const idx = this.handlers.findIndex((_) => _ === handler)
      if (idx >= 0) {
        this.handlers.splice(idx, 1)
      }
    }
  }

  public close() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}
