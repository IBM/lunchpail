import type { DemoWorkerPool } from "./pool"
import type QueueEvent from "@jay/common/events/QueueEvent.js"
import type EventSourceLike from "@jay/common/events/EventSourceLike"

import Base from "./base"
import { runs } from "./misc"

export default class DemoQueueEventSource extends Base implements EventSourceLike {
  protected override initInterval() {
    // nothing to do; this class will respond to `sendUpdate()` calls from elsewhere
  }

  private queueEvent(workerpool: DemoWorkerPool, taskqueue: string, workerIndex: number): QueueEvent {
    return {
      timestamp: Date.now(),
      event: {
        metadata: {
          name: `queue-${runs[0]}-${taskqueue}`,
          namespace: "none", // FIXME?
          creationTimestamp: new Date().toUTCString(),
          labels: {
            "app.kubernetes.io/part-of": runs[0], // TODO multiple demo runs?
            "app.kubernetes.io/name": workerpool.name,
            "codeflare.dev/worker-index": String(workerIndex),
          },
          annotations: {
            "codeflare.dev/status": "Running",
            "codeflare.dev/inbox": String(workerpool.inboxes[workerIndex][taskqueue] || 0),
            "codeflare.dev/outbox": String(workerpool.outboxes[workerIndex][taskqueue] || 0),
            "codeflare.dev/processing": String(workerpool.processing[workerIndex][taskqueue] || 0),
          },
        },
        spec: {
          dataset: taskqueue,
        },
      },
    }
  }

  public sendUpdate(workerpool: DemoWorkerPool, taskqueueLabel: string, workerIndex: number) {
    const model = this.queueEvent(workerpool, taskqueueLabel, workerIndex)
    setTimeout(() =>
      this.handlers.forEach((handler) => handler(new MessageEvent("queue", { data: JSON.stringify([model]) }))),
    )
  }
}
