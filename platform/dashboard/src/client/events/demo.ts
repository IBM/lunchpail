import type EventSourceLike from "../events/EventSourceLike.js"
import type QueueEvent from "../components/WorkerPoolModel.js"
import type { WorkerPoolStatusEvent } from "../components/WorkerPoolModel.js"
import type DataSetModel from "../components/DataSetModel.js"
import { intervalParam } from "../App"

const runs = ["R1"]
const datasets = Array(3)
  .fill(0)
  .map((_, idx) => idx.toString()) // ["0", "1", "2"]
const datasetIsLive = Array(datasets.length).fill(false) // [false, false, false]
const workerpools = ["A", "B"]
const workerpoolMaxQueueDepth = [5, 12]

function getRandomLiveDataSetIndex() {
  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    const dsidx = Math.floor(Math.random() * datasets.length)
    if (datasetIsLive[dsidx]) {
      return dsidx
    }
  }
}

function randomQueueEvent(workerpool: string, nWorkers: number): QueueEvent {
  const workerIndex = Math.floor(Math.random() * nWorkers)
  const dataset = datasets[getRandomLiveDataSetIndex()]
  return {
    timestamp: Date.now(),
    run: runs[0], // TODO multiple demo runs?
    workerIndex,
    workerpool,
    dataset,
    inbox: Math.round(Math.random() * 4),
    outbox: Math.round(Math.random() * 2),
    processing: Math.round(Math.random() * 0.6),
  }
}

function randomWorkerPoolStatusEvent(workerpool: string, nWorkers: number): WorkerPoolStatusEvent {
  return {
    timestamp: Date.now(),
    workerpool,
    nodeClass: "md",
    supportsGpu: false,
    age: "",
    status: "Running",
    ready: Math.round(Math.random() * nWorkers),
    size: nWorkers,
  }
}

type Handler = (evt: MessageEvent) => void

export class DemoDataSetEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = intervalParam()) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * datasets.length)
          const model: DataSetModel = {
            timestamp: Date.now(),
            label: datasets[whichToUpdate],
            inbox: ~~(Math.random() * 20),
            outbox: ~~(Math.random() * 2),
          }
          datasetIsLive[whichToUpdate] = true
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

  public constructor(private readonly intervalMillis = 2000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * workerpools.length)
          const workerpool = workerpools[whichToUpdate]
          const N = workerpoolMaxQueueDepth[whichToUpdate]
          const model = randomQueueEvent(workerpool, N)
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

export class DemoWorkerPoolStatusEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = 2000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * workerpools.length)
          const workerpool = workerpools[whichToUpdate]
          const N = workerpoolMaxQueueDepth[whichToUpdate]
          const model = randomWorkerPoolStatusEvent(workerpool, N)
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
