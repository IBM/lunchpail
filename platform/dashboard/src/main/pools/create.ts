/**
 * Create a WorkerPool using the given `yaml` spec.
 */
export default async function onPoolCreate(yaml: string): Promise<boolean> {
  const { spawn } = await import("node:child_process")
  return new Promise((resolve, reject) => {
    try {
      // the -f - means accept the yaml on stdin
      const child = spawn("kubectl", ["apply", "-f", "-"], { stdio: ["pipe", "inherit", "inherit"] })

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
