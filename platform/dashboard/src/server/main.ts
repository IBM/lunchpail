import ViteExpress from "vite-express"
import express, { Response } from "express"

import type WorkerPoolModel from "../client/components/WorkerPoolModel"

const app = express()

// ##############################################################
// DELETE LATER: hard coding some WorkerPool data to see UI
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
// ##############################################################

function initEventSource(res: Response) {
  res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  })
  res.flushHeaders()
}

function sendEvent(model: unknown, res: Response) {
  res.write(`data: ${JSON.stringify(model)}\n\n`)
}

app.get("/datasets", (_, res) => {
  initEventSource(res)

  const model = [
    { label: ds1, inbox: ~~(Math.random() * 20), outbox: 0 },
    { label: ds2, inbox: ~~(Math.random() * 20), outbox: 0 },
    { label: ds3, inbox: ~~(Math.random() * 20), outbox: 0 },
  ]
  sendEvent(model, res)
})

app.get("/workerpools", (_, res) => {
  initEventSource(res)

  const model = [randomWP, randomWP2]
  sendEvent(model, res)
})

ViteExpress.listen(app, 3000, () => console.log("Server is listening on port 3000..."))
