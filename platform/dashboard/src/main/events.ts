import { ipcMain, ipcRenderer } from "electron"
import { clusterExists } from "./prereq/check"
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
    const cb = (model) => mainWindow.webContents.send("/datasets/event", { data: JSON.parse(model) })
    stream.on("data", cb)
    ipcMain.once("/datasets/close", () => {
      stream.off("data", cb)
      stream.end()
    })
  })

  ipcMain.on("/queues/open", () => {
    const stream = startQueueStream()
    const cb = (model) => mainWindow.webContents.send("/queues/event", { data: JSON.parse(model) })
    stream.on("data", cb)
    ipcMain.once("/queues/close", () => {
      stream.off("data", cb)
      stream.end()
    })
  })

  ipcMain.on("/pools/open", () => {
    const stream = startPoolStream()
    const cb = (model) => mainWindow.webContents.send("/pools/event", { data: JSON.parse(model) })
    stream.on("data", cb)
    ipcMain.once("/pools/close", () => {
      stream.off("data", cb)
      stream.end()
    })
  })

  ipcMain.on("/applications/open", () => {
    const stream = startApplicationStream()
    const cb = (model) => mainWindow.webContents.send("/applications/event", { data: JSON.parse(model) })
    stream.on("data", cb)
    ipcMain.once("/applications/close", () => {
      stream.off("data", cb)
      stream.end()
    })
  })
  ipcMain.handle("/prereqs/check", () => {
    // Checking if we have a control plane cluster running
    return clusterExists()
  })
}

export default {
  on(source: "datasets" | "queues" | "pools" | "applications", cb: unknown) {
    ipcRenderer.on(`/${source}/event`, cb)
    ipcRenderer.send(`/${source}/open`)

    //
    // We need to handle the `off` function differently due to issues
    // with contextBridge. It turns out that `cb` will be a *copy* of
    // the original function, hence a naive use of removeListener
    // won't actually unlisten. See
    // https://github.com/electron/electron/issues/21437#issuecomment-802288574
    //
    return () => {
      ipcRenderer.removeListener(`/${source}/event`, cb)
      ipcRenderer.send(`/${source}/close`)
    }
  },
  async isLaptopReady() {
    const isReady = await ipcRenderer.invoke("/prereqs/check")
    return isReady
  },
}
