import type DemoQueueEventSource from "./queue"
import type DemoTaskQueueEventSource from "./taskqueue"
import type ExecResponse from "@jaas/common/events/ExecResponse"
import type EventSourceLike from "@jaas/common/events/EventSourceLike"
import type CreateResourceHandler from "@jaas/common/events/NewPoolHandler"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

import Base from "./base"
import context from "../context"
import { apiVersion, ns } from "./misc"
import { inbox, inboxIncr } from "./taskqueue"
import getNormallyDistributedRandomNumber from "../util/rand"

export type DemoWorkerPool = {
  name: string
  numWorkers: number
  run: string
  taskqueue: string
  inboxes: Record<string, number>[]
  outboxes: Record<string, number>[]
  processing: Record<string, number>[]
}

export default class DemoWorkerPoolStatusEventSource extends Base implements EventSourceLike {
  /** Model of current worker pools */
  private readonly workerpools: DemoWorkerPool[] = []

  public constructor(
    private readonly taskqueues: DemoTaskQueueEventSource,
    private readonly queues: DemoQueueEventSource,
    intervalMillis?: number,
  ) {
    super(intervalMillis)
  }

  public get pools(): readonly DemoWorkerPool[] {
    return this.workerpools
  }

  private randomWorkerPoolStatusEvent(workerpool: DemoWorkerPool, status = "Running"): WorkerPoolStatusEvent {
    const nWorkers = workerpool.numWorkers

    return {
      apiVersion,
      kind: "WorkerPool",
      metadata: {
        context,
        name: workerpool.name,
        namespace: ns,
        creationTimestamp: new Date().toUTCString(),
        annotations: {
          "codeflare.dev/status": status,
          "codeflare.dev/ready": Math.round(Math.random() * nWorkers).toString(),
        },
      },
      spec: {
        run: { name: workerpool.run },
        workers: {
          size: "md",
          supportsGpu: false,
          count: nWorkers,
        },
      },
    }
  }

  private sendEventFor = (workerpool: Readonly<DemoWorkerPool>, status?: string): void => {
    const model = this.randomWorkerPoolStatusEvent(workerpool, status)
    setTimeout(() =>
      this.handlers.forEach((handler) => handler(new MessageEvent("pool", { data: JSON.stringify([model]) }))),
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
    const { queues, taskqueues } = this

    let active = false
    this.simulators.push(
      setInterval(
        (function interval() {
          // pull work off a taskqueue
          if (active) return interval
          else active = true

          // eslint-disable-next-line no-async-promise-executor
          new Promise(async () => {
            const taskqueueLabel = pool.taskqueue
            const taskqueue = taskqueues.sets.find((_) => _.metadata.name === taskqueueLabel)
            if (taskqueue && inbox(taskqueue) > 0) {
              inboxIncr(taskqueue, -1)
              pool.inboxes[workerIndex][taskqueue.metadata.name] =
                (pool.inboxes[workerIndex][taskqueue.metadata.name] || 0) + 1
              queues.sendUpdate(pool, taskqueueLabel, workerIndex)
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
    const { taskqueues, queues } = this

    const once = () => {
      // check if we're dead
      if (!this.workerpools.find((_) => _.name === pool.name)) {
        return
      }

      // find work in an inbox and start processing it
      const taskqueuesArr = [pool.taskqueue]
      for (let poolTaskQueueIndex = 0; poolTaskQueueIndex < taskqueuesArr.length; poolTaskQueueIndex++) {
        const taskqueueLabel = taskqueuesArr[poolTaskQueueIndex]
        if (pool.inboxes[workerIndex][taskqueueLabel] > 0) {
          pool.inboxes[workerIndex][taskqueueLabel]-- // inbox--
          pool.processing[workerIndex][taskqueueLabel] = (pool.processing[workerIndex][taskqueueLabel] || 0) + 1 // processing++
          queues.sendUpdate(pool, taskqueueLabel, workerIndex)

          // after a "think time",
          setTimeout(() => {
            pool.outboxes[workerIndex][taskqueueLabel] = (pool.outboxes[workerIndex][taskqueueLabel] || 0) + 1 // outbox++
            pool.processing[workerIndex][taskqueueLabel]-- // processing--

            const taskqueue = taskqueues.sets.find((_) => _.metadata.name === taskqueueLabel)
            if (taskqueue) {
              // mark it as done in the taskqueue, too
              // taskqueue.outbox++
            }

            queues.sendUpdate(pool, taskqueueLabel, workerIndex)
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

  public delete(props: { name: string; namespace: string }): ExecResponse {
    const poolIdx = this.workerpools.findIndex((_) => _.name === props.name)
    if (poolIdx >= 0) {
      this.sendEventFor(this.workerpools[poolIdx], "Terminating")
      this.workerpools.splice(poolIdx, 1)
      this.simulators.splice(poolIdx, 1)
      return true
    } else {
      return {
        code: 404,
        message: "Resource not found",
      }
    }
  }

  public create(...params: Parameters<CreateResourceHandler>): ExecResponse {
    const values = params[0]
    const numWorkers = parseInt(values.count, 10)

    const pool = {
      name: values.name,
      numWorkers,
      run: values.run,
      taskqueue: values.taskqueue,
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

    return true
  }
}
