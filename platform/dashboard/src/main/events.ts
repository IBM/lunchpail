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

function streamForKind(kind: Kind): import("stream").Transform {
  switch (kind) {
    case "datasets":
      return startDataSetStream()
    case "queues":
      return startQueueStream()
    case "workerpools":
      return startPoolStream()
    case "platformreposecrets":
      return startPlatformRepoSecretStream()
    case "applications":
      return startApplicationStream()
  }
}

/**
 * This will register an `ipcMain` listener for `/${kind}/open`
 * messages. Upon receipt of such a message, this logic will initiate
 * a watcher against the given `kind` of resource. It will pass back
 * any messages to the sender of that message.
 */
function initStreamForResourceKind(kind: Kind) {
  const openEvent = `/${kind}/open`
  const dataEvent = `/${kind}/event`
  const closeEvent = `/${kind}/close`

  // listen for /open messages
  ipcMain.on(openEvent, (evt) => {
    // We have received such a message, so initialize the watcher,
    // which will give us a stream of serialized models. We do so in
    // `init()`, but we need to manage premature closing of the
    // streams. This can happen if the `kubectl` watchers are spawned
    // before the CRDs have been registered.

    // has /${kind}/close been called from the client? we need to
    // distinguish an intentional close coming from the client vs a
    // stream close due to premature exit of kubectl
    let closedOnPurpose = false

    let stream: null | ReturnType<typeof streamForKind> = null

    const init = () => {
      const myStream = streamForKind(kind)
      stream = myStream

      // callback to renderer
      const cb = (model) => evt.sender.send(dataEvent, { data: JSON.parse(model) })

      // when a `/${kind}/close` message is received, tear down the watcher
      const cleanup = () => {
        closedOnPurpose = true
        if (stream) {
          ipcMain.removeListener(closeEvent, cleanup)
          myStream.off("data", cb)
          myStream.end()
        }
      }

      ipcMain.once(closeEvent, cleanup)

      // when we get a serialized model, send an event back to the sender
      stream.on("data", cb)

      stream.once("close", async () => {
        if (!closedOnPurpose) {
          cleanup()
          closedOnPurpose = false

          // double-check that a purposeful close hasn't been
          // requested in the interim (this function is async...)
          if (!closedOnPurpose) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            init()
          }
        }
      })
    }

    init()
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
    await import("./controlplane/install").then((_) => _.default("lite", "apply"))
    return true
  })

  // control plane teardown request
  ipcMain.handle("/controlplane/destroy", async () => {
    await import("./controlplane/install").then((_) => _.default("lite", "delete"))
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
