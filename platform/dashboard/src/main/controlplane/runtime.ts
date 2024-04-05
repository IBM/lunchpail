import { promisify } from "node:util"
import { exec } from "node:child_process"

import { getControlPlaneNamespaceForExistingInstallation } from "./namespace"

export async function isRuntimeProvisioned(clusterName: string, quiet = false) {
  try {
    const clusterOpt = clusterName ? `--context ${clusterName}` : ""

    const command = promisify(exec)
    const result = await command(
      `kubectl --request-timeout=1s ${clusterOpt} get deploy --no-headers -n ${await getControlPlaneNamespaceForExistingInstallation(clusterName)} -l app.kubernetes.io/part-of=lunchpail.io`,
    )
    return result.stdout.split(/\n/).length >= 2 // run and application controllers
  } catch (e) {
    if (!quiet && !/context was not found/.test(String(e))) {
      console.error(e)
    }
    return false
  }
}
