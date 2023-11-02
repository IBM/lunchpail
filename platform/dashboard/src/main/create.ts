import ExecResponse from "@jay/common/events/ExecResponse"

/**
 * Create a resource using the given `yaml` spec.
 */
export async function onCreate(
  yaml: string,
  action: "apply" | "delete" = "apply",
  dryRun = false,
): Promise<ExecResponse> {
  const { spawn } = await import("node:child_process")
  return new Promise((resolve) => {
    try {
      // the `-f -` means accept the yaml on stdin
      const child = spawn("kubectl", [action, "-f", "-", ...(dryRun === false ? [] : ["--dry-run=server"])], {
        stdio: ["pipe", "inherit", "pipe"],
      })

      // send the yaml to the kubectl apply across stdin
      child.stdin.write(yaml)
      child.stdin.end()

      let err = ""
      child.stderr.on("data", (data) => (err += data.toString()))

      child.once("close", (code) => {
        if (code === 0) {
          resolve(true)
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

export function hasMessage(obj: unknown): obj is { message: string } {
  return typeof (obj as { message: string }).message === "string"
}

/**
 * Delete a resource by name
 */
export async function onDelete(yaml: string): Promise<ExecResponse> {
  return onCreate(yaml, "delete")
}

/**
 * Delete a resource by name
 */
export async function onDeleteByName({
  kind,
  name,
  namespace,
}: import("@jay/common/api/jay").DeleteProps): Promise<ExecResponse> {
  const { spawn } = await import("node:child_process")
  return new Promise((resolve) => {
    try {
      // the `-f -` means accept the yaml on stdin
      const child = spawn("kubectl", ["delete", kind, name, "-n", namespace])

      let err = ""
      child.stderr.on("data", (data) => (err += data.toString()))

      child.once("close", (code) => {
        if (code === 0) {
          resolve(true)
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
