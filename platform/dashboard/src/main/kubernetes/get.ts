import { hasMessage } from "./create"
import { getKubeconfig } from "../controlplane/kind"
import ExecResponse from "@jay/common/events/ExecResponse"

/**
 * Get a resource by name
 */
export async function onGet({
  kind,
  name,
  namespace,
}: import("@jay/common/api/jay").DeleteProps): Promise<ExecResponse> {
  const [kubeconfig, { spawn }] = await Promise.all([getKubeconfig(), import("node:child_process")])

  return new Promise((resolve) => {
    try {
      const child = spawn("kubectl", ["get", "--kubeconfig", kubeconfig.path, kind, name, "-n", namespace, "-o=json"])

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
