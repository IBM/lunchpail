import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

/**
 * Install the kind CLI (if necessary)
 */
async function installKindCliIfNeeded() {
  // TODO
}

/**
 * Create a Kind cluster to host the control plane (if necessary).
 *
 * @return the name of the cluster and the kubeconfig to use against
 * the cluster
 */
export default async function createKindClusterIfNeeded(clusterName = "codeflare-platform") {
  await installKindCliIfNeeded()

  // TODO
  const execPromise = promisify(exec)
  const kubeconfig = await file()

  await execPromise(`kind export kubeconfig -n ${clusterName} --kubeconfig ${kubeconfig.path}`)

  return {
    clusterName,
    kubeconfig,
  }
}
