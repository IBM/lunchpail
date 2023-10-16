import { ipcMain, ipcRenderer } from "electron"

import startPoolStream from "./streams/pool"
import startQueueStream from "./streams/queue"
import startDataSetStream from "./streams/dataset"
import startApplicationStream from "./streams/application"
import startPlatformRepoSecretStream from "./streams/platformreposecret"

import { Status, getStatusFromMain } from "./controlplane/status"

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

/** Valid resource types. TODO share this with renderer */
const kinds = ["datasets", "queues", "workerpools", "applications", "platformreposecrets"] as const
type Kind = (typeof kinds)[number]

/**
 * This will register an `ipcMain` listener for `/${kind}/open`
 * messages. Upon receipt of such a message, this logic will initiate
 * a watcher against the given `kind` of resource. It will pass back
 * any messages to the sender of that message.
 */
function initStreamForResourceKind(kind: Kind) {
  // listen for /open messages
  ipcMain.on(`/${kind}/open`, (evt) => {
    // we have received such a message, so initialize the watcher,
    // which will give us a stream of serialized models
    const stream =
      kind === "datasets"
        ? startDataSetStream()
        : kind === "queues"
        ? startQueueStream()
        : kind === "workerpools"
        ? startPoolStream()
        : kind === "platformreposecrets"
        ? startPlatformRepoSecretStream()
        : startApplicationStream()

    // when we get a serialized model, send an event back to the sender
    const cb = (model) => evt.sender.send(`/${kind}/event`, { data: JSON.parse(model) })
    stream.on("data", cb)

    // when a `/${kind}/close` message is received, tear down the watcher
    const cleanup = () => {
      stream.off("data", cb)
      stream.end()
    }
    ipcMain.once(`/${kind}/close`, cleanup)
  })
}

export function initEvents() {
  // listen for /open events from the renderer, one per `Kind` of
  // resource
  kinds.forEach(initStreamForResourceKind)

  // resource create request
  ipcMain.handle("/create", (_, yaml: string) => import("./pools/create").then((_) => _.default(yaml)))

  // control plane status request
  ipcMain.handle("/controlplane/status", getStatusFromMain)

  // control plane setup request
  ipcMain.handle("/controlplane/init", async () => {
    await import("./prereq/install").then((_) => _.default("lite", "apply"))
    return true
  })

  // control plane teardown request
  ipcMain.handle("/controlplane/destroy", async () => {
    await import("./prereq/install").then((_) => _.default("lite", "delete"))
    return true
  })
}

/**
 * The UI has asked to be informed of events related to the given
 * `kind` of resource. Pass that request on to the main process. It
 * will call us back on the `/event` channel, and then we pass these
 * return messages, in turn, back to the UI via the given `cb` callback.
 */
function onFromClientSide(this: Kind, _: "message", cb: (...args: unknown[]) => void) {
  ipcRenderer.on(`/${this}/event`, cb)
  ipcRenderer.send(`/${this}/open`)

  //
  // We need to handle the `off` function differently due to issues
  // with contextBridge. It turns out that `cb` will be a *copy* of
  // the original function, hence a naive use of removeListener
  // won't actually unlisten. See
  // https://github.com/electron/electron/issues/21437#issuecomment-802288574
  //
  return () => {
    ipcRenderer.removeListener(`/${this}/event`, cb)
    ipcRenderer.send(`/${this}/close`)
  }
}

const apiImpl = {
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

kinds.forEach((kind) => {
  apiImpl[kind] = {
    on: onFromClientSide.bind(kind),
  }

  apiImpl["createResource"] = (yaml: string) => {
    ipcRenderer.invoke("/create", yaml)
  }
})

/**
 * This is the JaasAPI renderer-side implementation. TODO, we need to
 * find a way to share datatypes with the renderer.
 */
export default apiImpl
