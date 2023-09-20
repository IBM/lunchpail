import ViteExpress from "vite-express"
import express, { Response } from "express"
import type { Writable } from "stream"

import startPoolStream from "./streams/pool.js"
import startQueueStream from "./streams/queue.js"
import startDataSetStream from "./streams/dataset.js"
import startApplicationStream from "./streams/application.js"

const app = express()

async function initEventSource(res: Response, stream: Writable) {
  await res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  })
  await res.flushHeaders()

  // If client closes connection, stop sending events
  res.on("close", () => {
    console.log("client dropped me")
    stream.end()
    res.end()
  })
}

async function sendEvent(model: unknown, res: Response) {
  if (model) {
    await res.write(`data: ${model}\n\n`)
  }
}

app.get("/datasets", async (req, res) => {
  const stream = startDataSetStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/queues", async (req, res) => {
  const stream = startQueueStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/pools", async (req, res) => {
  const stream = startPoolStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/applications", async (req, res) => {
  const stream = startApplicationStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/newpool", async () => {
  // TODO
})

ViteExpress.listen(app, 3000, () => console.log("Server is listening on port 3000..."))
