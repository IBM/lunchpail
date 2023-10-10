import { exec } from "child_process"
import { promisify } from "util"

export async function clusterExists() {
  try {
    const command = promisify(exec)
    const result = await command("kind get clusters")
    return result.stdout.includes("codeflare-platform")
  } catch (e) {
    console.error(e)
    return false
  }
}
