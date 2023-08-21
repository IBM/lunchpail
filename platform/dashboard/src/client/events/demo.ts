import type EventSourceLike from "../events/EventSourceLike.js"
import type DataSetModel from "../components/DataSetModel.js"
import type WorkerPoolModel from "../components/WorkerPoolModel.js"

const datasets = ["0", "1", "2"]

function randomWorker(max = 4): WorkerPoolModel["inbox"][number] {
  const model: WorkerPoolModel["inbox"][number] = {}
  datasets.forEach((dataset) => {
    model[dataset] = ~~(Math.random() * max)
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
      .map(() => randomWorker()),
    processing: Array(N)
      .fill(0)
      .map(() => randomWorker(1)),
    label,
  }
}

type Handler = (evt: MessageEvent) => void

export class DemoDataSetEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = 4000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const model: DataSetModel[] = datasets.map((label) => ({
            label,
            inbox: ~~(Math.random() * 20),
            outbox: 0,
          }))
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

  public constructor(private readonly intervalMillis = 4000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
      this.interval = setInterval(
        (function interval() {
          const model: WorkerPoolModel[] = [randomWP("A", 5), randomWP("B", 8)]
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
