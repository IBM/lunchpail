import { LoremIpsum } from "lorem-ipsum"
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
  inboxes: Record<string, number>[]
  outboxes: Record<string, number>[]
  processing: Record<string, number>[]
}

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
})

const ns = lorem.generateWords(3).replace(/\s/g, "-")
const runs = ["R1"]
const applications = Array(1)
  .fill(0)
  .map(() => ({
    name: uniqueNamesGenerator({ dictionaries: [animals] }),
    description: lorem.generateSentences(2),
    repoPath: lorem.generateWords(2).replace(/\s/g, "/"),
    image: lorem.generateWords(2).replace(/\s/g, "-"),
    file: lorem.generateWords(1).replace(/\s/g, "-"),
  }))

function boxMullerTransform() {
  const u1 = Math.random()
  const u2 = Math.random()

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2)

  return { z0, z1 }
}

function getNormallyDistributedRandomNumber(mean: number, stddev: number) {
  const { z0 } = boxMullerTransform()

  return z0 * stddev + mean
}

function randomWorkerPoolStatusEvent(workerpool: DemoWorkerPool): WorkerPoolStatusEvent {
  const nWorkers = workerpool.numWorkers

  return {
    timestamp: Date.now(),
    namespace: ns,
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

function randomApplicationSpecEvent({
  name,
  file,
  image,
  repoPath,
  description,
}: {
  name: string
  file: string
  image: string
  repoPath: string
  description: string
}): ApplicationSpecEvent {
  return {
    timestamp: Date.now(),
    namespace: ns,
    application: name,
    description,
    api: "workqueue",
    image,
    repo: `https://github.com/${repoPath}`,
    command: `python ${file}.py`,
    supportsGpu: false,
    age: new Date().toLocaleString(),
  }
}

type Handler = (evt: MessageEvent) => void

export class DemoDataSetEventSource implements EventSourceLike {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  public constructor(private readonly intervalMillis = intervalParam()) {}

  private readonly colors = ["blue", "green", "purple"]
  private readonly endpoints = ["e1", "e2", "e3"]
  private readonly buckets = ["pile1", "pile2", "pile3"]
  private readonly isReadOnly = [true, false, true]

  private readonly datasets: Omit<DataSetModel, "timestamp">[] = Array(3)
    .fill(0)
    .map((_, idx) => ({
      label: this.colors[idx],
      storageType: "COS",
      endpoint: this.endpoints[idx],
      bucket: this.buckets[idx],
      isReadOnly: this.isReadOnly[idx],
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

  private queueEvent(workerpool: DemoWorkerPool, dataset: string, workerIndex: number): QueueEvent {
    return {
      timestamp: Date.now(),
      run: runs[0], // TODO multiple demo runs?
      workerIndex,
      workerpool: workerpool.name,
      dataset,
      inbox: workerpool.inboxes[workerIndex][dataset] || 0,
      outbox: workerpool.outboxes[workerIndex][dataset] || 0,
      processing: workerpool.processing[workerIndex][dataset] || 0,
    }
  }

  public sendUpdate(workerpool: DemoWorkerPool, datasetLabel: string, workerIndex: number) {
    const model = this.queueEvent(workerpool, datasetLabel, workerIndex)
    setTimeout(() =>
      this.handlers.forEach((handler) => handler(new MessageEvent("queue", { data: JSON.stringify(model) }))),
    )
  }

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.handlers.push(handler)
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

  public close() {}
}

export class DemoWorkerPoolStatusEventSource implements EventSourceLike, NewPoolHandler {
  private readonly handlers: Handler[] = []

  private interval: null | ReturnType<typeof setInterval> = null

  private readonly workerpools: DemoWorkerPool[] = []

  public constructor(
    private readonly datasets: DemoDataSetEventSource,
    private readonly queues: DemoQueueEventSource,
    private readonly intervalMillis = 2000,
  ) {}

  public get pools(): readonly DemoWorkerPool[] {
    return this.workerpools
  }

  private sendEventFor = (workerpool: Readonly<DemoWorkerPool>): void => {
    const model = randomWorkerPoolStatusEvent(workerpool)
    setTimeout(() =>
      this.handlers.forEach((handler) => handler(new MessageEvent("pool", { data: JSON.stringify(model) }))),
    )
  }

  private initInterval() {
    if (!this.interval) {
      const { workerpools, sendEventFor } = this

      this.interval = setInterval(
        (function interval() {
          if (workerpools.length > 0) {
            const whichToUpdate = Math.floor(Math.random() * workerpools.length)
            sendEventFor(workerpools[whichToUpdate])
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

  private simulators: ReturnType<typeof setInterval>[] = []

  private initGrabWorkSimulatorForWorker(pool: DemoWorkerPool, workerIndex: number) {
    const { queues, datasets } = this

    let active = false
    this.simulators.push(
      setInterval(
        (function interval() {
          // pull work off a dataset
          if (active) return interval
          else active = true

          // eslint-disable-next-line no-async-promise-executor
          new Promise(async () => {
            const poolDataSetIndex = Math.floor(Math.random() * pool.datasets.length)
            const datasetLabel = pool.datasets[poolDataSetIndex]
            const dataset = datasets.sets.find((_) => _.label === datasetLabel)
            if (dataset && dataset.inbox > 0) {
              dataset.inbox--
              pool.inboxes[workerIndex][dataset.label] = (pool.inboxes[workerIndex][dataset.label] || 0) + 1
              queues.sendUpdate(pool, datasetLabel, workerIndex)
            }

            await new Promise((resolve) => setTimeout(resolve, getNormallyDistributedRandomNumber(3000, 1500)))
            active = false
          })
          return interval
        })(),
        getNormallyDistributedRandomNumber(1000, 300),
      ),
    )
  }

  private initDoWorkSimulatorForWorker(pool: DemoWorkerPool, workerIndex: number) {
    const timeOfProcessing = getNormallyDistributedRandomNumber(6000, 3000)
    const timeBetweenProcessing = getNormallyDistributedRandomNumber(6000, 2000)
    const { datasets, queues } = this

    const once = () => {
      // find work in an inbox and start processing it
      for (let poolDatasetIndex = 0; poolDatasetIndex < pool.datasets.length; poolDatasetIndex++) {
        const datasetLabel = pool.datasets[poolDatasetIndex]
        if (pool.inboxes[workerIndex][datasetLabel] > 0) {
          pool.inboxes[workerIndex][datasetLabel]-- // inbox--
          pool.processing[workerIndex][datasetLabel] = (pool.processing[workerIndex][datasetLabel] || 0) + 1 // processing++
          queues.sendUpdate(pool, datasetLabel, workerIndex)

          // after a "think time",
          setTimeout(() => {
            pool.outboxes[workerIndex][datasetLabel] = (pool.outboxes[workerIndex][datasetLabel] || 0) + 1 // outbox++
            pool.processing[workerIndex][datasetLabel]-- // processing--

            const dataset = datasets.sets.find((_) => _.label === datasetLabel)
            if (dataset) {
              // mark it as done in the dataset, too
              dataset.outbox++
            }

            queues.sendUpdate(pool, datasetLabel, workerIndex)
            setTimeout(once, timeBetweenProcessing)
          }, timeOfProcessing)

          break
        }
      }
    }

    once()
  }

  private initSimulator(pool: DemoWorkerPool) {
    for (let workerIndex = 0; workerIndex < pool.numWorkers; workerIndex++) {
      this.initGrabWorkSimulatorForWorker(pool, workerIndex)
      this.initDoWorkSimulatorForWorker(pool, workerIndex)
    }
  }

  public newPool(...params: Parameters<NewPoolHandler["newPool"]>) {
    const values = params[0]
    const numWorkers = parseInt(values.count, 10)

    const pool = {
      name: values.poolName,
      numWorkers,
      applications: [values.application],
      datasets: [values.dataset],
      inboxes: Array(numWorkers)
        .fill(0)
        .map(() => ({})),
      outboxes: Array(numWorkers)
        .fill(0)
        .map(() => ({})),
      processing: Array(numWorkers)
        .fill(0)
        .map(() => ({})),
    }

    this.workerpools.push(pool)
    this.sendEventFor(pool)
    this.initSimulator(pool)
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
