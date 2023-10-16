import type DemoQueueEventSource from "./queue"
import type DemoDataSetEventSource from "./dataset"
import type EventSourceLike from "../../events/EventSourceLike"
import type CreateResourceHandler from "../../events/NewPoolHandler"
import type WorkerPoolStatusEvent from "../../events/WorkerPoolStatusEvent"

import Base from "./base"
import { ns } from "./misc"
import getNormallyDistributedRandomNumber from "../util/rand"

export type DemoWorkerPool = {
  name: string
  numWorkers: number
  applications: string[]
  datasets: string[]
  inboxes: Record<string, number>[]
  outboxes: Record<string, number>[]
  processing: Record<string, number>[]
}

export default class DemoWorkerPoolStatusEventSource extends Base implements EventSourceLike {
  /** Model of current worker pools */
  private readonly workerpools: DemoWorkerPool[] = []

  public constructor(
    private readonly datasets: DemoDataSetEventSource,
    private readonly queues: DemoQueueEventSource,
    intervalMillis?: number,
  ) {
    super(intervalMillis)
  }

  public get pools(): readonly DemoWorkerPool[] {
    return this.workerpools
  }

  private randomWorkerPoolStatusEvent(workerpool: DemoWorkerPool): WorkerPoolStatusEvent {
    const nWorkers = workerpool.numWorkers

    return {
      timestamp: Date.now(),
      namespace: ns,
      workerpool: workerpool.name,
      applications: workerpool.applications,
      datasets: workerpool.datasets,
      nodeClass: "md",
      supportsGpu: false,
      age: "",
      status: "Running",
      ready: Math.round(Math.random() * nWorkers),
      size: nWorkers,
    }
  }

  private sendEventFor = (workerpool: Readonly<DemoWorkerPool>): void => {
    const model = this.randomWorkerPoolStatusEvent(workerpool)
    setTimeout(() =>
      this.handlers.forEach((handler) => handler(new MessageEvent("pool", { data: JSON.stringify(model) }))),
    )
  }

  protected override initInterval(intervalMillis: number) {
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
        intervalMillis,
      )
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

  public createResource(...params: Parameters<CreateResourceHandler>) {
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
