import type EventSourceLike from "../events/EventSourceLike.js"
import type DataSetModel from "../components/DataSetModel.js"
import type WorkerPoolModel from "../components/WorkerPoolModel.js"

const ds1 = "0"
const ds2 = "1"
const ds3 = "2"

const randomWP: WorkerPoolModel = {
  inbox: [{ [ds1]: 1, [ds2]: 3 }, { [ds1]: 2 }, { [ds1]: 3, [ds3]: 1 }, { [ds1]: 4 }, { [ds1]: 5 }],
  outbox: [{ [ds1]: 2 }, { [ds1]: 2, [ds3]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }],
  processing: [{ [ds1]: 1 }, { [ds1]: 0 }, { [ds1]: 1 }, { [ds1]: 1 }, { [ds1]: 1 }],
  label: "A",
}
const randomWP2: WorkerPoolModel = {
  inbox: [
    { [ds1]: 5 },
    { [ds1]: 2 },
    { [ds1]: 3 },
    { [ds1]: 4 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 2 },
    { [ds1]: 3 },
    { [ds1]: 4 },
  ],
  outbox: [{ [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }],
  processing: [
    { [ds1]: 0 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 0 },
    { [ds1]: 1 },
    { [ds1]: 0 },
  ],
  label: "B",
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
          const model: DataSetModel[] = [
            { label: ds1, inbox: ~~(Math.random() * 20), outbox: 0 },
            { label: ds2, inbox: ~~(Math.random() * 20), outbox: 0 },
            { label: ds3, inbox: ~~(Math.random() * 20), outbox: 0 },
          ]
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
          const model: WorkerPoolModel[] = [randomWP, randomWP2]
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
