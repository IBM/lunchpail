import { file } from "tmp-promise"
import { promisify } from "node:util"
import { exec } from "node:child_process"

const defaultClusterName = "codeflare-platform"

/**
 * Install the kind CLI (if necessary)
 */
async function installKindCliIfNeeded() {
  // TODO
}

/**
 * Create kind cluster with the given `clusterName`
 */
function createKindCluster(clusterName = defaultClusterName) {
  // TODO
  if (clusterName) {
    //
  }
}

/**
 * @return the `kubeconfig` for the given `clusterName`
 */
export async function getKubeconfig(clusterName = defaultClusterName) {
  const execPromise = promisify(exec)
  const kubeconfig = await file()

  await execPromise(`kind export kubeconfig -n ${clusterName} --kubeconfig ${kubeconfig.path}`)

  return kubeconfig
}

/**
 * Create a Kind cluster to host the control plane (if necessary).
 *
 * @return the name of the cluster and the kubeconfig to use against
 * the cluster
 */
export default async function createKindClusterIfNeeded(clusterName = defaultClusterName) {
  await installKindCliIfNeeded()
  await createKindCluster(clusterName)
  const kubeconfig = await getKubeconfig(clusterName)

  return {
    clusterName,
    kubeconfig,
  }
}
