import { uniqueNamesGenerator, colors, animals } from "unique-names-generator"

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
}

function nRandomNames(N: number): string[] {
  const randomName = uniqueNamesGenerator.bind(undefined, { dictionaries: [colors, animals], length: 2 })

  return Array(N).fill(0).map(randomName)
}

const ns = "ns"
const runs = ["R1"]
const applications = nRandomNames(1)
const datasets = nRandomNames(3)
const workerpools: DemoWorkerPool[] = []

function randomQueueEvent(workerpool: DemoWorkerPool): QueueEvent {
  const nWorkers = workerpool.numWorkers
  const workerIndex = Math.floor(Math.random() * nWorkers)
  return {
    timestamp: Date.now(),
    run: runs[0], // TODO multiple demo runs?
    workerIndex,
    workerpool: workerpool.name,
    dataset: workerpool.datasets[0], // TODO
    inbox: Math.round(Math.random() * 4),
    outbox: Math.round(Math.random() * 2),
    processing: Math.round(Math.random() * 0.6),
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
          if (workerpool) {
            if (workerpool.numWorkers > 0) {
              const model = randomQueueEvent(workerpool)
              handlers.forEach((handler) => handler(new MessageEvent("dataset", { data: JSON.stringify(model) })))
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

export class DemoWorkerPoolStatusEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = 2000) {}

  private initInterval() {
    if (!this.interval) {
      const handlers = this.handlers
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

import type NewPoolHandler from "./NewPoolHandler"
export const DemoNewPoolHandler: NewPoolHandler = (values) => {
  workerpools.push({
    name: values.poolName,
    numWorkers: parseInt(values.count, 10),
    applications: [values.application],
    datasets: [values.dataset],
  })
}
