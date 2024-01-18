import { hasMessage } from "./create"
import { clusterNameForKubeconfig } from "../controlplane/kind"

import type { DeleteProps } from "@jay/common/api/jay"
import type ExecResponse from "@jay/common/events/ExecResponse"

/**
 * Get a resource by name
 */
export async function onGet({
  kind,
  name,
  namespace,
  context = clusterNameForKubeconfig,
}: DeleteProps): Promise<ExecResponse> {
  const [{ spawn }] = await Promise.all([import("node:child_process")])

  return new Promise((resolve) => {
    try {
      const child = spawn("kubectl", ["get", "--context", context, kind, name, "-n", namespace, "-o=json"])

      let err = ""
      child.stderr.on("data", (data) => (err += data.toString()))

      let out = ""
      child.stdout.on("data", (data) => (out += data.toString()))

      child.once("close", (code) => {
        if (code === 0) {
          resolve({ code, message: out })
        } else {
          resolve({ code, message: err })
        }
      })
    } catch (err) {
      console.error(err)
      resolve({ code: 1, message: hasMessage(err) ? err.message : "" })
    }
  })
}
