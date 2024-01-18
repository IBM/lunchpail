import which from "which"
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
export async function createKindCluster(clusterName: string, dryRun = false, existsOk = false) {
  const execPromise = promisify(exec)
  const response = await execPromise("kind get clusters", execOpts)
  if (/No kind/.test(response.stdout) || !response.stdout.includes(clusterName)) {
    if (dryRun) {
      return true
    } else {
      return execPromise(`kind create cluster -n ${clusterName}`, execOpts)
    }
  } else {
    if (!existsOk) {
      throw new Error("Cluster already exists: " + clusterName)
    } else {
      return true
    }
  }
}

/** Delete the given Kind cluster */
export function deleteKindCluster(clusterName: string) {
  const execPromise = promisify(exec)
  return execPromise("kind delete cluster -n " + clusterName.replace(/^kind-/, ""), execOpts)
}

/**
 * Create a Kind cluster to host the control plane (if necessary).
 */
export default async function createKindClusterIfNeeded(clusterName: string, action: Action, dryRun = false) {
  if (action !== "delete") {
    if (!dryRun) {
      await checkPodman()
      await installKindCliIfNeeded()
    }
    await createKindCluster(clusterName, dryRun, true)
  }
}

export async function doesKindClusterExist(clusterName: string) {
  try {
    const command = promisify(exec)
    const result = await command("kind get clusters", execOpts)
    return result.stdout.includes(clusterName.replace(/^kind-/, ""))
  } catch (e) {
    console.error(e)
    return false
  }
}

/** Is the given Kubernetes context a kind cluster? */
export function isKindCluster(context: import("@jay/common/api/kubernetes").KubeConfig["contexts"][number]["context"]) {
  return /^kind-/.test(context.cluster)
}
