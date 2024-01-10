import which from "which"
import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

import type Action from "./action"
import checkPodman from "./podman"

/** The cluster name we pass internally to `kind` CLI operations */
const clusterName = "jaas" // don't export this

/** The cluster name that shows up in Kubernetes context models */
export const clusterNameForKubeconfig = "kind-" + clusterName

const execOpts = {
  env: Object.assign({}, process.env, {
    // i think kind is smart enough to set this on its own
    // KIND_EXPERIMENTAL_PROVIDER: "podman",
  }),
}

/**
 * Install the kind CLI (if necessary)
 */
async function installKindCliIfNeeded() {
  if (!(await which("kind"))) {
    if (process.platform === "darwin") {
      const execPromise = promisify(exec)
      await execPromise("brew install kind")
    } else {
      throw new Error("kind CLI not installed")
    }
  }
}

/**
 * Create kind cluster with the given `clusterName`
 */
async function createKindCluster(clusterName: string) {
  if (clusterName) {
    const execPromise = promisify(exec)
    const response = await execPromise("kind get clusters", execOpts)
    if (/No kind/.test(response.stdout) || !response.stdout.includes(clusterName)) {
      await execPromise(`kind create cluster -n ${clusterName}`, execOpts)
    }
  }
}

/** Delete the given Kind cluster */
export function deleteKindCluster(clusterName: string) {
  const execPromise = promisify(exec)
  return execPromise("kind delete cluster -n " + clusterName.replace(/^kind-/, ""), execOpts)
}

export type KubeconfigFile = {
  path: Promise<string>
  rescan: () => Promise<unknown>
  needsInitialization(): boolean
  state: () => "Fetching" | "Valid" | "NoKindCli" | "NoKindCluster" | "Error"
}

/**
 * @return the `kubeconfig` for the given `clusterName`
 */
export async function getKubeconfig(): Promise<KubeconfigFile> {
  const execPromise = promisify(exec)
  const kubeconfig = await file()

  let state: ReturnType<KubeconfigFile["state"]> = "Fetching"

  function rescan() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<string>(async (resolve) => {
      let done = false
      let alreadyToldUserKindNotInstalled = false
      let alreadyToldUserNoKindCluster = false

      while (!done) {
        try {
          // invoke kind export kubeconfig
          const output = await execPromise(
            `kind export kubeconfig -n ${clusterName} --kubeconfig ${kubeconfig.path}`,
            execOpts,
          )

          // log output if in DEBUG mode
          if (process.env.DEBUG) {
            console.log(output.stdout)
            console.error(output.stderr)
          }

          // success!
          state = "Valid"
          resolve(kubeconfig.path)
          done = true // break out of the while loop
        } catch (err) {
          if (/not found/.test(String(err))) {
            // kind not installed
            state = "NoKindCli"
            if (!alreadyToldUserKindNotInstalled) {
              alreadyToldUserKindNotInstalled = true
              console.error("kind not installed")
            }
          } else if (/could not locate any control plane nodes for cluster named/.test(String(err))) {
            // kind cluster for JaaS Manager does not exist
            state = "NoKindCluster"
            if (!alreadyToldUserNoKindCluster) {
              alreadyToldUserNoKindCluster = true
              console.error("Management cluster not found")
            }
          } else {
            state = "Error"
            console.error(err)
          }

          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    })
  }

  return {
    path: rescan(),
    rescan,
    state: () => state,
    needsInitialization: () => state === "NoKindCli" || state === "NoKindCluster",
  }
}

/**
 * Create a Kind cluster to host the control plane (if necessary).
 *
 * @return the name of the cluster and the kubeconfig to use against
 * the cluster
 */
export default async function createKindClusterIfNeeded(action: Action, kubeconfig: KubeconfigFile) {
  if (action !== "delete") {
    await checkPodman()
    await installKindCliIfNeeded()
    await createKindCluster(clusterName)
    await kubeconfig.rescan()
  }
}

export async function doesKindClusterExist() {
  try {
    const command = promisify(exec)
    const result = await command("kind get clusters", execOpts)
    return result.stdout.includes(clusterName)
  } catch (e) {
    console.error(e)
    return false
  }
}

/** Is the given Kubernetes context a kind cluster? */
export function isKindCluster(context: import("@jay/common/api/kubernetes").KubeConfig["contexts"][number]["context"]) {
  return /^kind-/.test(context.cluster)
}
