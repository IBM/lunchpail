import { ipcMain, ipcRenderer } from "electron"

import startPoolStream from "./streams/pool.js"
import startQueueStream from "./streams/queue.js"
import startDataSetStream from "./streams/dataset.js"
import startApplicationStream from "./streams/application.js"

/*async function initEventSource(res: Response, stream: Writable) {
  await res.set({
    "Cache-Control": "no-cache",
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
  })
  await res.flushHeaders()

  // If client closes connection, stop sending events
  res.on("close", () => {
    stream.end()
    res.end()
  })
}

async function sendEvent(model: unknown, res: Response) {
  if (model) {
    await res.write(`data: ${model}\n\n`)
  }
}

app.get("/api/datasets", async (req, res) => {
  const stream = startDataSetStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/api/queues", async (req, res) => {
  const stream = startQueueStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/api/pools", async (req, res) => {
  const stream = startPoolStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/api/applications", async (req, res) => {
  const stream = startApplicationStream()
  stream.on("data", (model) => sendEvent(model, res))
  await initEventSource(res, stream)
})

app.get("/api/newpool", async () => {
  // TODO
})

*/

export function initEvents(mainWindow: import("electron").BrowserWindow) {
  ipcMain.on("/datasets/open", () => {
    const stream = startDataSetStream()
    stream.on("data", (model) => mainWindow.webContents.send("/datasets/event", { data: JSON.parse(model) }))
    ipcMain.once("/datasets/close", () => stream.end())
  })

  ipcMain.on("/queues/open", () => {
    const stream = startQueueStream()
    stream.on("data", (model) => mainWindow.webContents.send("/queues/event", { data: JSON.parse(model) }))
    ipcMain.once("/queues/close", () => stream.end())
  })

  ipcMain.on("/pools/open", () => {
    const stream = startPoolStream()
    stream.on("data", (model) => mainWindow.webContents.send("/pools/event", { data: JSON.parse(model) }))
    ipcMain.once("/pools/close", () => stream.end())
  })

  ipcMain.on("/applications/open", () => {
    const stream = startApplicationStream()
    stream.on("data", (model) => mainWindow.webContents.send("/applications/event", { data: JSON.parse(model) }))
    ipcMain.once("/applications/close", () => stream.end())
  })
}

export default {
  on(source: "datasets" | "queues" | "pools" | "applications", cb: DataSetModel) {
    ipcRenderer.on(`/${source}/event`, cb)
    ipcRenderer.send(`/${source}/open`)
  },
  off(source: "datasets" | "queues" | "pools" | "applications", cb: DataSetModel) {
    ipcRenderer.off(`/${source}/event`, cb)
    ipcRenderer.send(`/${source}/close`)
  },
}
