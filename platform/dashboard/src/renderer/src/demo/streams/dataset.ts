import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type EventSourceLike from "@jay/common/events/EventSourceLike"

import Base from "./base"
import { ns } from "./misc"

export const colors = ["pink", "green", "purple"]

export function inbox(dataset: DataSetEvent) {
  return parseInt(dataset.metadata.annotations["codeflare.dev/unassigned"] || "0", 10)
}

export function inboxIncr(dataset: DataSetEvent, incr = 1) {
  dataset.metadata.annotations["codeflare.dev/unassigned"] = String(inbox(dataset) + incr)
}

export default class DemoDataSetEventSource extends Base implements EventSourceLike {
  private readonly endpoints = ["e1", "e2", "e3"]
  private readonly buckets = ["pile1", "pile2", "pile3"]
  private readonly isReadOnly = [true, false, true]

  private readonly datasets: DataSetEvent[] = Array(3)
    .fill(0)
    .map((_, idx) => ({
      metadata: {
        name: colors[idx],
        namespace: ns,
        creationTimestamp: new Date().toUTCString(),
        annotations: {
          "codeflare.dev/status": "Ready",
          "codeflare.dev/unassigned": "0",
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

  public get sets(): readonly Omit<DataSetEvent, "timestamp">[] {
    return this.datasets
  }

  private sendEventFor = (
    dataset: (typeof this.datasets)[number],
    status = dataset.metadata.annotations["codeflare.dev/status"],
  ) => {
    const model: DataSetEvent = Object.assign({}, dataset, {
      status,
      timestamp: Date.now(),
      //inbox: ~~(Math.random() * 20),
      //outbox: ~~(Math.random() * 2),
    })
    this.handlers.forEach((handler) => handler(new MessageEvent("dataset", { data: JSON.stringify([model]) })))
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { datasets, sendEventFor } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * datasets.length)
          const dataset = datasets[whichToUpdate]
          inboxIncr(dataset)
          sendEventFor(dataset)
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }

  public override delete(props: { name: string; namespace: string }) {
    const idx = this.datasets.findIndex(
      (_) => _.metadata.name === props.name && _.metadata.namespace === props.namespace,
    )
    if (idx >= 0) {
      const model = this.datasets[idx]
      this.datasets.splice(idx, 1)
      this.sendEventFor(model, "Terminating")
      return true
    } else {
      return false
    }
  }
}
