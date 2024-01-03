import { ipcMain, ipcRenderer } from "electron"

import { getKubeconfig } from "./controlplane/kind"
import startStreamForKind from "./streams/kubernetes"
import { Status, getStatusFromMain } from "./controlplane/status"

import type WatchedKind from "@jay/common/Kind"
import type JayApi from "@jay/common/api/jay"
import type ExecResponse from "@jay/common/events/ExecResponse"
import type { DeleteProps, JayResourceApi } from "@jay/common/api/jay"
import type KubernetesResource from "@jay/common/events/KubernetesResource"

function streamForKind(kind: WatchedKind, kubeconfig: Promise<string>): Promise<import("stream").Transform> {
  switch (kind) {
    case "taskqueues":
      return startStreamForKind("datasets", kubeconfig, { selectors: ["app.kubernetes.io/component=taskqueue"] })
    case "datasets":
      return startStreamForKind("datasets", kubeconfig, { selectors: ["app.kubernetes.io/component!=taskqueue"] })
    case "queues":
      return startStreamForKind("queues.codeflare.dev", kubeconfig, { withTimestamp: true })
    case "workerpools":
      return startStreamForKind("workerpools.codeflare.dev", kubeconfig)
    case "platformreposecrets":
      return startStreamForKind("platformreposecrets.codeflare.dev", kubeconfig)
    case "applications":
      return startStreamForKind("applications.codeflare.dev", kubeconfig)
    case "workdispatchers":
      return startStreamForKind("workdispatchers.codeflare.dev", kubeconfig)
  }
}

/**
 * This will register an `ipcMain` listener for `/${kind}/open`
 * messages. Upon receipt of such a message, this logic will initiate
 * a watcher against the given `kind` of resource. It will pass back
 * any messages to the sender of that message.
 */
function initStreamForResourceKind(kind: WatchedKind, kubeconfig: Promise<string>) {
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

    const init = async () => {
      const myStream = await streamForKind(kind, kubeconfig)

      // callback to renderer
      const cb = (model) => {
        try {
          evt.sender.send(dataEvent, { data: JSON.parse(model) })
        } catch (err) {
          if (!myStream.closed && !myStream.destroyed && !myStream.errored && !evt.sender.isDestroyed()) {
            // if the stream seems healthy, and we got an error
            // sending the event back to the renderer, we'd better
            // report this error
            console.error(err)
          }
        }
      }

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
  "taskqueues",
  "datasets",
  "queues",
  "workerpools",
  "applications",
  "platformreposecrets",
  "workdispatchers",
]

const logsDataChannel = (selector: string, namespace: string) => `/logs/${namespace}/${String(selector)}/data`
const logsInitChannel = "/logs/init"
const logsCloseChannel = (selector: string, namespace: string) => `/logs/${namespace}/${String(selector)}/close`

export function initEvents() {
  // listen for /open events from the renderer, one per `Kind` of
  // resource
  const kubeconfigPromise = getKubeconfig().then((_) => _.path)
  kinds.forEach((kind) => initStreamForResourceKind(kind, kubeconfigPromise))

  // logs
  ipcMain.on(logsInitChannel, async (evt, selector: string, namespace: string, follow: boolean) => {
    const { stream, close } = await import("./streams/logs").then((_) => _.default(selector, namespace, follow))
    stream.on("data", (data) => evt.sender.send(logsDataChannel(selector, namespace), data.toString()))
    ipcMain.once(logsCloseChannel(selector, namespace), close)
  })

  // list available Kubernetes contexts
  ipcMain.handle("/kubernetes/contexts", () => import("./kubernetes/contexts").then((_) => _.get()))

  // resource get request
  ipcMain.handle("/get", (_, props: string) =>
    import("./kubernetes/get").then((_) => _.onGet(JSON.parse(props) as DeleteProps)),
  )

  ipcMain.handle("/s3/listProfiles", () => import("./s3/listProfiles").then((_) => _.default()))

  ipcMain.handle("/s3/listBuckets", (_, endpoint: string, accessKey: string, secretKey: string) =>
    import("./s3/listBuckets").then((_) => _.default(endpoint, accessKey, secretKey)),
  )

  ipcMain.handle("/s3/listObjects", (_, endpoint: string, accessKey: string, secretKey: string, bucket: string) =>
    import("./s3/listObjects").then((_) => _.default(endpoint, accessKey, secretKey, bucket)),
  )

  /** Make a bucket */
  ipcMain.handle("/s3/makeBucket", (_, endpoint: string, accessKey: string, secretKey: string, bucket: string) =>
    import("./s3/makeBucket").then((_) => _.default(endpoint, accessKey, secretKey, bucket)),
  )

  ipcMain.handle(
    "/s3/getObject",
    (_, endpoint: string, accessKey: string, secretKey: string, bucket: string, object: string) =>
      import("./s3/getObject").then((_) => _.default(endpoint, accessKey, secretKey, bucket, object)),
  )

  // resource create request
  ipcMain.handle("/create", (_, yaml: string, dryRun = false) =>
    import("./kubernetes/create").then((_) => _.onCreate(yaml, "apply", dryRun)),
  )

  // resource delete request given the yaml spec
  ipcMain.handle("/delete/yaml", (_, yaml: string) => import("./kubernetes/create").then((_) => _.onDelete(yaml)))

  // resource delete request by name
  ipcMain.handle("/delete/name", (_, props: string) =>
    import("./kubernetes/create").then((_) => _.onDeleteByName(JSON.parse(props) as DeleteProps)),
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
    /** Jobs as a Service API to server-side control plane functionality */
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

    /**
     * S3 API
     */
    s3: {
      /** @return list of available AWS-style profiles */
      listProfiles(): Promise<import("@jay/common/api/s3").Profile[]> {
        return ipcRenderer.invoke("/s3/listProfiles")
      },

      /** @return list of buckets for the given s3 accessKey */
      listBuckets(
        endpoint: string,
        accessKey: string,
        secretKey: string,
      ): Promise<import("minio").BucketItemFromList[]> {
        return ipcRenderer.invoke("/s3/listBuckets", endpoint, accessKey, secretKey)
      },

      /** @return list of objects in the given s3 bucket */
      async listObjects(
        endpoint: string,
        accessKey: string,
        secretKey: string,
        bucket: string,
      ): Promise<{ name: string; size: number; lastModified: Date }[]> {
        return ipcRenderer.invoke("/s3/listObjects", endpoint, accessKey, secretKey, bucket)
      },

      /** Make a bucket */
      makeBucket(endpoint: string, accessKey: string, secretKey: string, bucket: string): Promise<void> {
        return ipcRenderer.invoke("/s3/makeBucket", endpoint, accessKey, secretKey, bucket)
      },

      /** @return object content */
      async getObject(
        endpoint: string,
        accessKey: string,
        secretKey: string,
        bucket: string,
        object: string,
      ): Promise<string> {
        return ipcRenderer.invoke("/s3/getObject", endpoint, accessKey, secretKey, bucket, object)
      },
    },

    /** Available Kubernetes contexts */
    async contexts(): Promise<{ contexts: string[]; current: string }> {
      const response = await ipcRenderer.invoke("/kubernetes/contexts")
      if (response === true) {
        throw new Error("Internal error")
      } else if (response.code === 0) {
        return JSON.parse(response.message)
      } else {
        throw new Error(response.message)
      }
    },

    /** Fetch a resource */
    async get<R extends KubernetesResource>(props: DeleteProps): Promise<R> {
      const response = (await ipcRenderer.invoke("/get", JSON.stringify(props))) as ExecResponse
      if (response === true) {
        throw new Error("Internal error")
      } else if (response.code === 0) {
        return JSON.parse(response.message) as R
      } else {
        throw new Error(response.message)
      }
    },

    /** Create a resource */
    create: (_, yaml: string, dryRun = false): Promise<ExecResponse> => {
      return ipcRenderer.invoke("/create", yaml, dryRun)
    },

    /** Delete a resource */
    delete: (yaml: string): Promise<ExecResponse> => {
      return ipcRenderer.invoke("/delete/yaml", yaml)
    },

    /** Delete a resource by name */
    deleteByName: (props: DeleteProps): Promise<ExecResponse> => {
      return ipcRenderer.invoke("/delete/name", JSON.stringify(props))
    },

    /** Tail on logs for a given resource */
    logs(selector: string, namespace: string, follow: boolean, cb: (chunk: string) => void) {
      const mycb = (_, chunk: string) => cb(chunk)
      ipcRenderer.on(logsDataChannel(selector, namespace), mycb)
      ipcRenderer.send(logsInitChannel, selector, namespace, follow)

      return () => {
        ipcRenderer.removeListener(logsDataChannel(selector, namespace), mycb)
        ipcRenderer.send(logsCloseChannel(selector, namespace))
      }
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
