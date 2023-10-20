import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import filterOutMissingCRDs from "./filter-missing-crd-errors"

import type PlatformRepoSecretEvent from "@jaas/common/events/PlatformRepoSecretEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `PlatformRepoSecretEvent`
 */
function transformLineToEvent(sep: string) {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      // Splits the string by spaces
      const [name, status, age] = chunk.toString().split(sep)

      const model: PlatformRepoSecretEvent = {
        timestamp: Date.now(),
        namespace: "",
        name,
        status,
        age,
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `PlatformRepoSecretEvent` data
 */
export default function startPlatformRepoSecretStream() {
  try {
    const sep = "|||"
    const child = spawn("kubectl", [
      "get",
      "platformreposecrets.codeflare.dev",
      "-A",
      "--no-headers",
      "--watch",
      "-o",
      `jsonpath={.metadata.name}{"${sep}"}{.metadata.annotations.codeflare\\.dev/status}{"${sep}"}{.metadata.creationTimestamp}{"${sep}\\n"}`,
    ])

    child.stderr.pipe(filterOutMissingCRDs).pipe(process.stderr)

    const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent(sep))
    splitter.once("error", console.error)
    splitter.once("close", () => {
      splitter.off("error", console.error)
      child.kill()
    })
    return splitter
  } catch (err) {
    console.error(err)
    throw err
  }
}
