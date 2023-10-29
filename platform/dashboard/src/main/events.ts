import { ipcMain, ipcRenderer } from "electron"

import startStreamForKind from "./streams/kubernetes"
import { Status, getStatusFromMain } from "./controlplane/status"

import type WatchedKind from "@jay/common/Kind"
import type JayApi from "@jay/common/api/jay"
import ExecResponse from "@jay/common/events/ExecResponse"
import type { DeleteProps, JayResourceApi } from "@jay/common/api/jay"

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

function streamForKind(kind: WatchedKind): import("stream").Transform {
  switch (kind) {
    case "datasets":
      return startStreamForKind("dataset")
    case "queues":
      return startStreamForKind("queues.codeflare.dev", true)
    case "workerpools":
      return startStreamForKind("workerpools.codeflare.dev")
    case "platformreposecrets":
      return startStreamForKind("platformreposecrets.codeflare.dev")
    case "applications":
      return startStreamForKind("application.codeflare.dev")
    case "tasksimulators":
      return startStreamForKind("tasksimulators.codeflare.dev")
  }
}

/**
 * This will register an `ipcMain` listener for `/${kind}/open`
 * messages. Upon receipt of such a message, this logic will initiate
 * a watcher against the given `kind` of resource. It will pass back
 * any messages to the sender of that message.
 */
function initStreamForResourceKind(kind: WatchedKind) {
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

    const init = () => {
      const myStream = streamForKind(kind)

      // callback to renderer
      const cb = (model) => evt.sender.send(dataEvent, { data: JSON.parse(model) })

      // when a `/${kind}/close` message is received, tear down the watcher
      const myCleanup = () => {
        closedOnPurpose = true
        ipcMain.removeListener(closeEvent, myCleanup)
        myStream.off("data", cb)
        myStream.destroy()
      }

      ipcMain.once(closeEvent, myCleanup)

      // when we get a serialized model, send an event back to the sender
      myStream.on("data", cb)

      myStream.once("close", async () => {
        if (!closedOnPurpose) {
          myCleanup()
          closedOnPurpose = false

          await new Promise((resolve) => setTimeout(resolve, 2000))
          if (!closedOnPurpose) {
            // ^^^ double-check that a purposeful close hasn't been
            // requested in the interim (this function is async...)
            init()
          }
        }
      })
    }

    init()
  })
}

/** TODO this is cloned from @jay/common/Kind.watchedKinds. Vite currently isn't happy with importing non-type bits from common */
const kinds: WatchedKind[] = [
  "datasets",
  "queues",
  "workerpools",
  "applications",
  "platformreposecrets",
  "tasksimulators",
]

export function initEvents() {
  // listen for /open events from the renderer, one per `Kind` of
  // resource
  kinds.forEach(initStreamForResourceKind)

  // resource create request
  ipcMain.handle("/create", (_, yaml: string, dryRun = false) =>
    import("./create").then((_) => _.onCreate(yaml, "apply", dryRun)),
  )

  // resource delete request
  ipcMain.handle("/delete", (_, props: string) =>
    import("./create").then((_) => _.onDelete(JSON.parse(props) as DeleteProps)),
  )

  // control plane status request
  ipcMain.handle("/controlplane/status", getStatusFromMain)

  // control plane setup request
  ipcMain.handle("/controlplane/init", async () => {
    await import("./controlplane/install").then((_) => _.default("lite", "apply"))
    return true
  })

  // control plane update (to latest version) request
  ipcMain.handle("/controlplane/update", async () => {
    await import("./controlplane/install").then((_) => _.default("lite", "update"))
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
function onFromClientSide(this: WatchedKind, _: "message", cb: (...args: unknown[]) => void) {
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

const apiImpl: JayApi = Object.assign(
  {
    controlplane: {
      async status() {
        const status = (await ipcRenderer.invoke("/controlplane/status")) as Status
        return status
      },
      init() {
        return ipcRenderer.invoke("/controlplane/init")
      },
      update() {
        return ipcRenderer.invoke("/controlplane/update")
      },
      destroy() {
        return ipcRenderer.invoke("/controlplane/destroy")
      },
    },

    create: (_, yaml: string, dryRun = false): Promise<ExecResponse> => {
      return ipcRenderer.invoke("/create", yaml, dryRun)
    },

    delete: (props: DeleteProps): Promise<ExecResponse> => {
      return ipcRenderer.invoke("/delete", JSON.stringify(props))
    },
  },
  kinds.reduce(
    (M, kind) =>
      Object.assign(M, {
        [kind]: {
          on: onFromClientSide.bind(kind),
        },
      }),
    {} as Record<WatchedKind, JayResourceApi>,
  ),
)

/**
 * This is the JaYAPI renderer-side implementation. TODO, we need to
 * find a way to share datatypes with the renderer.
 */
export default apiImpl
