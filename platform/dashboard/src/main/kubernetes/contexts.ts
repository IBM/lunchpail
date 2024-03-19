import { hasMessage } from "./create"
import type { KubeConfig } from "@jaas/common/api/kubernetes"
import type ExecResponse from "@jaas/common/events/ExecResponse"

/**
 * @return `ExecResponse`-stringified form of `KubeConfig`
 */
export async function get(): Promise<ExecResponse> {
  try {
    const config = await getConfig()

    return { code: 0, message: JSON.stringify({ config, current: config["current-context"] }) }
  } catch (err) {
    if (/ENOENT/.test(String(err))) {
      console.error("kubectl not found")
    } else {
      console.error(err)
    }
    return { code: 1, message: hasMessage(err) ? err.message : "" }
  }
}

/**
 * There may be two context entries that represent the same
 * ... context, as in the unique triple (cluster, name,
 * namespace). This can happen e.g. if a user issues a `kubectl config
 * rename-context foo bar`, and then subsequently re-authenticates
 * using an `oc login` which restores `foo` :/
 */
function removeDuplicateContexts(contexts: KubeConfig["contexts"]) {
  const byShortestName: Record<string, KubeConfig["contexts"][number]> = contexts.reduce((M, context) => {
    const key = context.context.cluster + "." + context.context.user + "." + context.context.namespace
    if (!(key in M) || context.name.length < M[key].name.length) {
      M[key] = context
    }
    return M
  }, {})
  return Object.values(byShortestName)
}

/**
 * @return the current `KubeConfig` model
 */
export async function getConfig(): Promise<KubeConfig> {
  const { spawn } = await import("node:child_process")

  return new Promise((resolve, reject) => {
    try {
      const child = spawn("kubectl", ["config", "view", "-o=json", "--flatten"])

      let err = ""
      child.stderr.on("data", (data) => (err += data.toString()))

      let out = ""
      child.stdout.on("data", (data) => (out += data.toString()))

      // important, to avoid uncaught exceptions
      child.once("error", (error) => {
        if (/ENOENT/.test(String(error))) {
          err += "kubectl not found"
        } else {
          err += String(error)
        }
      })

      child.once("close", (code) => {
        if (code === 0) {
          // it is important to trim before the split, to avoid a
          // trailing empty string inthe returned array
          const config = JSON.parse(out) as KubeConfig
          resolve(Object.assign(config, { contexts: removeDuplicateContexts(config.contexts) }))
        } else {
          reject(new Error(err))
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
