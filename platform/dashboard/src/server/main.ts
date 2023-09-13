import ViteExpress from "vite-express"
import express, { Response } from "express"

import startPoolStream from "./streams/pool"
import startQueueStream from "./streams/queue"
import startDataSetStream from "./streams/dataset"

const app = express()

async function initEventSource(res: Response) {
  await res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  })
  await res.flushHeaders()
}

async function sendEvent(model: unknown, res: Response) {
  if (model) {
    await res.write(`data: ${model}\n\n`)
  }
}

app.get("/datasets", async (req, res) => {
  await initEventSource(res)
  const stream = startDataSetStream()
  stream.on("data", (model) => sendEvent(model, res))
})

app.get("/queues", async (req, res) => {
  await initEventSource(res)
  const stream = startQueueStream()
  stream.on("data", (model) => sendEvent(model, res))
})

app.get("/pools", async (req, res) => {
  await initEventSource(res)
  const stream = startPoolStream()
  stream.on("data", (model) => sendEvent(model, res))
})

ViteExpress.listen(app, 3000, () => console.log("Server is listening on port 3000..."))
