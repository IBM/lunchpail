import { promisify } from "node:util"
import { exec } from "node:child_process"

export async function doesClusterExist() {
  try {
    const command = promisify(exec)
    const result = await command("kind get clusters")
    return result.stdout.includes("codeflare-platform")
  } catch (e) {
    console.error(e)
    return false
  }
}
