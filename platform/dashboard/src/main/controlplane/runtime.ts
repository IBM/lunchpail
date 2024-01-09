import { promisify } from "node:util"
import { exec } from "node:child_process"

import { clusterName as kindClusterName, getKubeconfig } from "./kind"

export async function isRuntimeProvisioned(
  clusterName?: string,
  quiet = false,
  kubeconfig?: Pick<Awaited<ReturnType<typeof getKubeconfig>>, "path">,
) {
  try {
    const kubeconfigOpt =
      !clusterName || clusterName === kindClusterName
        ? `--kubeconfig ${(kubeconfig || (await getKubeconfig())).path}`
        : ""
    const clusterOpt = clusterName ? `--cluster ${clusterName}` : ""

    const command = promisify(exec)
    const result = await command(
      `kubectl --request-timeout=1s ${kubeconfigOpt} ${clusterOpt} get deploy --no-headers -n codeflare-system -l app.kubernetes.io/part-of=codeflare.dev`,
    )
    return result.stdout.split(/\n/).length >= 2 // run and application controllers
  } catch (e) {
    if (!quiet) {
      console.error(e)
    }
    return false
  }
}
