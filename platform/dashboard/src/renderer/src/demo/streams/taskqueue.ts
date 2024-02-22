import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"
import type EventSourceLike from "@jaas/common/events/EventSourceLike"

import Base from "./base"
import colors from "./colors"
import context from "../context"
import { runs } from "./run"
import { applications } from "./application"
import { apiVersionDatashim, ns } from "./misc"

function unassignedKey(runName: string) {
  return `jaas.dev/unassigned.${context}.${ns}.${runName}`
}

export function inbox(taskqueue: TaskQueueEvent, runName: string) {
  return parseInt(taskqueue.metadata.annotations[unassignedKey(runName)] || "0", 10)
}

export function inboxIncr(taskqueue: TaskQueueEvent, runName: string, incr = 1) {
  taskqueue.metadata.annotations[unassignedKey(runName)] = String(inbox(taskqueue, runName) + incr)
}

export default class DemoTaskQueueEventSource extends Base implements EventSourceLike {
  private readonly endpoints = ["e1", "e2", "e3"]
  private readonly buckets = ["pile1", "pile2", "pile3"]
  private readonly isReadOnly = [true, false, true]

  private readonly taskqueues: TaskQueueEvent[] = Array(applications.length)
    .fill(0)
    .map((_, idx) => ({
      apiVersion: apiVersionDatashim,
      kind: "Dataset",
      metadata: {
        name: colors[idx],
        namespace: ns,
        context,
        creationTimestamp: new Date().toUTCString(),
        annotations: {
          "codeflare.dev/status": "Ready",
          [unassignedKey(applications[idx].name)]: "0",
        },
        labels: {
          "app.kubernetes.io/part-of": applications[idx].name,
        },
      },
      spec: {
        idx,
        local: {
          type: "COS",
          endpoint: this.endpoints[idx],
          bucket: this.buckets[idx],
          readonly: this.isReadOnly[idx],
        },
      },
    }))

  public get sets(): readonly Omit<TaskQueueEvent, "timestamp">[] {
    return this.taskqueues
  }

  private sendEventFor = (
    taskqueue: (typeof this.taskqueues)[number],
    status = taskqueue.metadata.annotations["codeflare.dev/status"],
  ) => {
    const model: TaskQueueEvent = Object.assign({}, taskqueue, {
      status,
      timestamp: Date.now(),
      //inbox: ~~(Math.random() * 20),
      //outbox: ~~(Math.random() * 2),
    })
    this.handlers.forEach((handler) => handler(new MessageEvent("taskqueue", { data: JSON.stringify([model]) })))
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { taskqueues, sendEventFor } = this

      this.interval = setInterval(
        (function interval() {
          const whichRunToUpdate = Math.floor(Math.random() * runs.length)
          const whichTaskQueueToUpdate = Math.floor(Math.random() * taskqueues.length)
          const taskqueue = taskqueues[whichTaskQueueToUpdate]
          inboxIncr(taskqueue, runs[whichRunToUpdate].metadata.name)
          sendEventFor(taskqueue)
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }

  public override delete(props: { name: string; namespace: string }) {
    const idx = this.taskqueues.findIndex(
      (_) => _.metadata.name === props.name && _.metadata.namespace === props.namespace,
    )
    if (idx >= 0) {
      const model = this.taskqueues[idx]
      this.taskqueues.splice(idx, 1)
      this.sendEventFor(model, "Terminating")
      return true
    } else {
      return {
        code: 404,
        message: "Resource not found",
      }
    }
  }
}
