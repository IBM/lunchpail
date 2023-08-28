import ViteExpress from "vite-express"
import express, { Response } from "express"

import type DataSetModel from "../client/components/DataSetModel"
import type WorkerPoolModel from "../client/components/WorkerPoolModel"

const app = express()

// ##############################################################
// DELETE LATER: hard coding some WorkerPool data to see UI
function initState() {
  const datasets = Array(3)
    .fill(0)
    .map((_, idx) => idx.toString()) // ["0", "1", "2"]
  const datasetIsLive = Array(datasets.length).fill(false) // [false, false, false]
  const workerpools = ["A", "B"]
  const workerpoolMaxQueueDepth = [5, 12]

  return { datasets, datasetIsLive, workerpools, workerpoolMaxQueueDepth }
}
type State = ReturnType<typeof initState>
const states: Record<string, State> = {}
function getState(ip: string, alwaysInit = false) {
  return (!alwaysInit && states[ip]) || (states[ip] = initState())
}

function randomWorker(state: State, max = 4): WorkerPoolModel["inbox"][number] {
  const model: WorkerPoolModel["inbox"][number] = {}
  state.datasets.forEach((dataset, idx) => {
    model[dataset] = state.datasetIsLive[idx] ? Math.round(Math.random() * max) : 0
  })
  return model
}

function randomWP(label: string, N: number, state: State): WorkerPoolModel {
  return {
    inbox: Array(N)
      .fill(0)
      .map(() => randomWorker(state)),
    outbox: Array(N)
      .fill(0)
      .map(() => randomWorker(state, 2)),
    processing: Array(N)
      .fill(0)
      .map(() => randomWorker(state, 0.6)),
    label,
  }
}
// ##############################################################

async function initEventSource(res: Response) {
  await res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  })
  await res.flushHeaders()
}

async function sendEvent(model: unknown, res: Response) {
  await res.write(`data: ${JSON.stringify(model)}\n\n`)
}

app.get("/datasets", async (req, res) => {
  await initEventSource(res)
  const state = getState(req.ip, true)

  setInterval(
    (function interval() {
      const whichToUpdate = Math.floor(Math.random() * state.datasets.length)
      const model: DataSetModel = {
        label: state.datasets[whichToUpdate],
        inbox: ~~(Math.random() * 20),
        outbox: 0,
      }
      sendEvent(model, res).then(() => {
        state.datasetIsLive[whichToUpdate] = true
      })
      return interval
    })(), // () means invoke the interval right away
    2000,
  )
})

app.get("/workerpools", async (req, res) => {
  await initEventSource(res)
  const state = getState(req.ip)

  setInterval(
    (function interval() {
      const whichToUpdate = Math.floor(Math.random() * state.workerpools.length)
      const label = state.workerpools[whichToUpdate]
      const N = state.workerpoolMaxQueueDepth[whichToUpdate]
      const model: WorkerPoolModel = randomWP(label, N, state)
      sendEvent(model, res)
      return interval
    })(), // () means invoke the interval right away
    2000,
  )
})

ViteExpress.listen(app, 3000, () => console.log("Server is listening on port 3000..."))
