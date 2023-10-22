/**
 * Create a resource using the given `yaml` spec.
 */
export async function onCreate(yaml: string, action: "apply" | "delete" = "apply"): Promise<boolean> {
  const { spawn } = await import("node:child_process")
  return new Promise((resolve, reject) => {
    try {
      // the `-f -` means accept the yaml on stdin
      const child = spawn("kubectl", [action, "-f", "-"], { stdio: ["pipe", "inherit", "inherit"] })

      // send the yaml to the kubectl apply across stdin
      child.stdin.write(yaml)
      child.stdin.end()

      child.once("close", (code) => {
        if (code === 0) {
          resolve(true)
        } else {
          reject(false)
        }
      })
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

/**
 * Delete a resource by name
 */
export async function onDelete({ kind, name, namespace }: import("@jay/common/api/jay").DeleteProps): Promise<boolean> {
  const { spawn } = await import("node:child_process")
  return new Promise((resolve, reject) => {
    try {
      // the `-f -` means accept the yaml on stdin
      const child = spawn("kubectl", ["delete", kind, name, "-n", namespace])

      child.once("close", (code) => {
        if (code === 0) {
          resolve(true)
        } else {
          reject(false)
        }
      })
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}
