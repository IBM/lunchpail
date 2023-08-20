import type EventSourceLike from "../events/EventSourceLike.js"
import type DataSetModel from "../components/DataSetModel.js"
import type WorkerPoolModel from "../components/WorkerPoolModel.js"

const ds1 = "0"
const ds2 = "1"
const ds3 = "2"

const randomWP: WorkerPoolModel = {
  inbox: [{ [ds1]: 1, [ds2]: 3 }, { [ds1]: 2 }, { [ds1]: 3, [ds3]: 1 }, { [ds1]: 4 }, { [ds1]: 5 }],
  outbox: [{ [ds1]: 2 }, { [ds1]: 2, [ds3]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }],
  processing: [{ [ds1]: 1 }, { [ds1]: 0 }, { [ds1]: 1 }, { [ds1]: 1 }, { [ds1]: 1 }],
  label: "A",
}
const randomWP2: WorkerPoolModel = {
  inbox: [
    { [ds1]: 5 },
    { [ds1]: 2 },
    { [ds1]: 3 },
    { [ds1]: 4 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 2 },
    { [ds1]: 3 },
    { [ds1]: 4 },
  ],
  outbox: [{ [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }, { [ds1]: 2 }],
  processing: [
    { [ds1]: 0 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 1 },
    { [ds1]: 0 },
    { [ds1]: 1 },
    { [ds1]: 0 },
  ],
  label: "B",
}

export class DemoDataSetEventSource implements EventSourceLike {
  public addEventListener(evt: "message" | "error", handler: (evt: MessageEvent) => void) {
    if (evt === "message") {
      const model: DataSetModel[] = [
        { label: ds1, inbox: ~~(Math.random() * 20), outbox: 0 },
        { label: ds2, inbox: ~~(Math.random() * 20), outbox: 0 },
        { label: ds3, inbox: ~~(Math.random() * 20), outbox: 0 },
      ]
      handler(new MessageEvent("dataset", { data: JSON.stringify(model) }))
    }
  }

  public removeEventListener(evt: "message" | "error" /*, handler: (evt: MessageEvent) => void*/) {
    if (evt === "message") {
      // TODO
    }
  }
}

export class DemoWorkerPoolEventSource implements EventSourceLike {
  public addEventListener(evt: "message" | "error", handler: (evt: MessageEvent) => void) {
    if (evt === "message") {
      const model: WorkerPoolModel[] = [randomWP, randomWP2]
      handler(new MessageEvent("dataset", { data: JSON.stringify(model) }))
    }
  }

  public removeEventListener(evt: "message" | "error" /*, handler: (evt: MessageEvent) => void*/) {
    if (evt === "message") {
      // TODO
    }
  }
}
