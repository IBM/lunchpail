import type EventSourceLike from "../events/EventSourceLike.js"
import type DataSetModel from "../components/DataSetModel.js"
import type WorkerPoolModel from "../components/WorkerPoolModel.js"
import { intervalParam } from "../App"

const datasets = Array(3)
  .fill(0)
  .map((_, idx) => idx.toString()) // ["0", "1", "2"]
const datasetIsLive = Array(datasets.length).fill(false) // [false, false, false]
const workerpools = ["A", "B"]
const workerpoolMaxQueueDepth = [5, 12]

function randomWorker(max = 4): WorkerPoolModel["inbox"][number] {
  const model: WorkerPoolModel["inbox"][number] = {}
  datasets.forEach((dataset, idx) => {
    model[dataset] = datasetIsLive[idx] ? Math.round(Math.random() * max) : 0
  })
  return model
}

function randomWP(label: string, N: number): WorkerPoolModel {
  return {
    inbox: Array(N)
      .fill(0)
      .map(() => randomWorker()),
    outbox: Array(N)
      .fill(0)
      .map(() => randomWorker(2)),
    processing: Array(N)
      .fill(0)
      .map(() => randomWorker(0.6)),
    label,
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
            label: datasets[whichToUpdate],
            inbox: ~~(Math.random() * 20),
            outbox: 0,
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
    }
  }
}

export class DemoWorkerPoolEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = 2000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * workerpools.length)
          const label = workerpools[whichToUpdate]
          const N = workerpoolMaxQueueDepth[whichToUpdate]
          const model: WorkerPoolModel = randomWP(label, N)
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
    }
  }
}
