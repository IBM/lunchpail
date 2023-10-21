import type DataSetEvent from "@jay/common/events/DataSetEvent"
import type EventSourceLike from "@jay/common/events/EventSourceLike"

import Base from "./base"

export const colors = ["pink", "green", "purple"]

export default class DemoDataSetEventSource extends Base implements EventSourceLike {
  private readonly endpoints = ["e1", "e2", "e3"]
  private readonly buckets = ["pile1", "pile2", "pile3"]
  private readonly isReadOnly = [true, false, true]

  private readonly datasets: Omit<DataSetEvent, "timestamp">[] = Array(3)
    .fill(0)
    .map((_, idx) => ({
      label: colors[idx],
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

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { datasets, handlers } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * datasets.length)
          const dataset = datasets[whichToUpdate]
          dataset.inbox++
          const model: DataSetEvent = Object.assign({}, dataset, {
            timestamp: Date.now(),
            //inbox: ~~(Math.random() * 20),
            //outbox: ~~(Math.random() * 2),
          })
          handlers.forEach((handler) => handler(new MessageEvent("dataset", { data: JSON.stringify(model) })))
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }
}
