import { promisify } from "node:util"
import { exec } from "node:child_process"

import { getKubeconfig } from "./kind"

export async function isRuntimeProvisioned(clusterName?: string) {
  try {
    const kubeconfig = await getKubeconfig(clusterName)

    const command = promisify(exec)
    const result = await command(
      `kubectl --kubeconfig ${kubeconfig.path} get deploy --no-headers -n codeflare-system -l app.kubernetes.io/part-of=codeflare.dev`,
    )
    return result.stdout.split(/\n/).length >= 2 // run and application controllers
  } catch (e) {
    console.error(e)
    return false
  }
}
