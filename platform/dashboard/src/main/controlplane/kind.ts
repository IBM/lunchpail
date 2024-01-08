import which from "which"
import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

import type Action from "./action"
import checkPodman from "./podman"

export const clusterName = "jaas"
export const clusterNameForKubeconfig = "kind-jaas"

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

/**
 * @return the `kubeconfig` for the given `clusterName`
 */
export async function getKubeconfig() {
  const execPromise = promisify(exec)
  const kubeconfig = await file()

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<Awaited<ReturnType<typeof file>>>(async (resolve) => {
    let done = false
    let alreadyToldUserKindNotInstalled = false

    while (!done) {
      try {
        const output = await execPromise(
          `kind export kubeconfig -n ${clusterName} --kubeconfig ${kubeconfig.path}`,
          execOpts,
        )
        if (process.env.DEBUG) {
          console.log(output.stdout)
          console.error(output.stderr)
        }
        resolve(kubeconfig)
        done = true
      } catch (err) {
        if (/not found/.test(String(err))) {
          if (!alreadyToldUserKindNotInstalled) {
            alreadyToldUserKindNotInstalled = true
            console.error("kind not installed")
          }
        } else {
          console.error(err)
        }

        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  })
}

/**
 * Create a Kind cluster to host the control plane (if necessary).
 *
 * @return the name of the cluster and the kubeconfig to use against
 * the cluster
 */
export default async function createKindClusterIfNeeded(action: Action) {
  if (action !== "delete") {
    await checkPodman()
    await installKindCliIfNeeded()
    await createKindCluster(clusterName)
  }

  const kubeconfig = await getKubeconfig()

  return {
    clusterName,
    kubeconfig,
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
