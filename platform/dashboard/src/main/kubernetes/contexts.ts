import { hasMessage } from "./create"
import ExecResponse from "@jay/common/events/ExecResponse"

/**
 * @return list of current available Kubernetes contexts and current
 * context, encoded into a stringified `{ contexts: string[]; current:
 * string }`
 */
export async function get(): Promise<ExecResponse> {
  try {
    const [contexts, current] = await Promise.all([getContexts(), getCurrentContext()])

    return { code: 0, message: JSON.stringify({ contexts, current }) }
  } catch (err) {
    console.error(err)
    return { code: 1, message: hasMessage(err) ? err.message : "" }
  }
}

async function getContexts() {
  const { spawn } = await import("node:child_process")

  return new Promise((resolve, reject) => {
    try {
      const child = spawn("kubectl", ["config", "get-contexts", "-o=name"])

      let err = ""
      child.stderr.on("data", (data) => (err += data.toString()))

      let out = ""
      child.stdout.on("data", (data) => (out += data.toString()))

      child.once("close", (code) => {
        if (code === 0) {
          // it is important to trim before the split, to avoid a
          // trailing empty string inthe returned array
          resolve(out.trim().split("\n"))
        } else {
          reject(new Error(err))
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

async function getCurrentContext() {
  const { execFile } = await import("node:child_process")

  return new Promise((resolve, reject) => {
    try {
      execFile("kubectl", ["config", "current-context"], (err, stdout, stderr) => {
        if (err) {
          console.error(stderr)
          reject(err) // TODO include stderr?
        } else {
          resolve(stdout.trim())
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}
