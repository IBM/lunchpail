import { ipcMain, ipcRenderer } from "electron"

import { clusterExists } from "./prereq/check"
import startPoolStream from "./streams/pool"
import startQueueStream from "./streams/queue"
import startDataSetStream from "./streams/dataset"
import startApplicationStream from "./streams/application"

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

async function getStatusFromMain() {
  // Checking if we have a control plane cluster running
  return { clusterExists: await clusterExists(), core: true, example: false }
}

type Status = ReturnType<typeof getStatusFromMain>

/** Valid resource types */
const kinds = ["datasets", "queues", "pools", "applications"]
type Kind = (typeof kinds)[number]

function initStreamForResourceKind(kind: Kind) {
  ipcMain.on(`/${kind}/open`, (evt) => {
    const stream =
      kind === "datasets"
        ? startDataSetStream()
        : kind === "queues"
        ? startQueueStream()
        : kind === "pools"
        ? startPoolStream()
        : startApplicationStream()

    const cb = (model) => evt.sender.send(`/${kind}/event`, { data: JSON.parse(model) })
    stream.on("data", cb)

    const cleanup = () => {
      stream.off("data", cb)
      stream.end()
    }
    ipcMain.once(`/${kind}/close`, cleanup)
  })
}

export function initEvents() {
  kinds.forEach(initStreamForResourceKind)

  ipcMain.handle("/pools/create", (_, yaml: string) => import("./pools/create").then((_) => _.default(yaml)))

  ipcMain.handle("/controlplane/status", getStatusFromMain)

  ipcMain.handle("/controlplane/init", async () => {
    await import("./prereq/install").then((_) => _.default("lite", "apply"))
    return true
  })

  ipcMain.handle("/controlplane/destroy", async () => {
    await import("./prereq/install").then((_) => _.default("lite", "delete"))
    return true
  })
}

function onFromClientSide(
  _: "message",
  source: "datasets" | "queues" | "pools" | "applications",
  cb: (...args: unknown[]) => void,
) {
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
}

export default {
  datasets: {
    on(evt: "message", cb: (...args: unknown[]) => void) {
      onFromClientSide(evt, "datasets", cb)
    },
  },
  applications: {
    on(evt: "message", cb: (...args: unknown[]) => void) {
      onFromClientSide(evt, "applications", cb)
    },
  },
  pools: {
    on(evt: "message", cb: (...args: unknown[]) => void) {
      onFromClientSide(evt, "pools", cb)
    },

    create(yaml: string) {
      ipcRenderer.invoke("/pools/create", yaml)
    },
  },
  queues: {
    on(evt: "message", cb: (...args: unknown[]) => void) {
      onFromClientSide(evt, "queues", cb)
    },
  },
  controlplane: {
    async status() {
      const isReady = (await ipcRenderer.invoke("/controlplane/status")) as Status
      return isReady
    },
    async init() {
      const response = await ipcRenderer.invoke("/controlplane/init")
      return response
    },
    async destroy() {
      const response = await ipcRenderer.invoke("/controlplane/destroy")
      return response
    },
  },
}
