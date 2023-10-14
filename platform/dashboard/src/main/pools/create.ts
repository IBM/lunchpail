export default async function onPoolCreate(yaml: string) {
  const { spawn } = await import("node:child_process")
  return new Promise((resolve, reject) => {
    try {
      const child = spawn("kubectl", ["apply", "-f", "-"], { stdio: ["pipe", "inherit", "inherit"] })

      // send the yaml across stdin
      child.stdin.write(yaml)
      child.stdin.end()

      child.on("close", (code) => {
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
