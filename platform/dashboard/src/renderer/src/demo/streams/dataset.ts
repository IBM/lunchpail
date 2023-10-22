import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type EventSourceLike from "@jay/common/events/EventSourceLike"

import Base from "./base"
import { ns } from "./misc"

export const colors = ["pink", "green", "purple"]

export default class DemoDataSetEventSource extends Base implements EventSourceLike {
  private readonly endpoints = ["e1", "e2", "e3"]
  private readonly buckets = ["pile1", "pile2", "pile3"]
  private readonly isReadOnly = [true, false, true]

  private readonly datasets: Omit<DataSetEvent, "timestamp">[] = Array(3)
    .fill(0)
    .map((_, idx) => ({
      label: colors[idx],
      namespace: ns,
      storageType: "COS",
      status: "Ready",
      endpoint: this.endpoints[idx],
      bucket: this.buckets[idx],
      isReadOnly: this.isReadOnly[idx],
      idx,
      inbox: 0,
      outbox: 0,
    }))

  public get sets(): readonly Omit<DataSetEvent, "timestamp">[] {
    return this.datasets
  }

  private sendEventFor = (dataset: (typeof this.datasets)[number], status = dataset.status) => {
    const model: DataSetEvent = Object.assign({}, dataset, {
      status,
      timestamp: Date.now(),
      //inbox: ~~(Math.random() * 20),
      //outbox: ~~(Math.random() * 2),
    })
    this.handlers.forEach((handler) => handler(new MessageEvent("dataset", { data: JSON.stringify(model) })))
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { datasets, sendEventFor } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * datasets.length)
          const dataset = datasets[whichToUpdate]
          dataset.inbox++
          sendEventFor(dataset)
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }

  public override delete(props: { name: string; namespace: string }) {
    const idx = this.datasets.findIndex((_) => _.label === props.name && _.namespace === props.namespace)
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
