import type { DemoWorkerPool } from "./pool"
import type QueueEvent from "@jaas/common/events/QueueEvent.js"
import type EventSourceLike from "@jaas/common/events/EventSourceLike"

import Base from "./base"
import { runs } from "./misc"

export default class DemoQueueEventSource extends Base implements EventSourceLike {
  protected override initInterval() {
    // nothing to do; this class will respond to `sendUpdate()` calls from elsewhere
  }

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
}
