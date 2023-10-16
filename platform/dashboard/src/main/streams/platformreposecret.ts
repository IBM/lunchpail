import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `PlatformRepoSecretEvent`
 */
function transformLineToEvent(sep: RegExp) {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      // Splits the string by spaces
      const [namespace, name, age] = chunk.toString().split(sep)

      const model /* FIXME : PlatformRepoSecretEvent */ = {
        timestamp: Date.now(),
        namespace,
        name,
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
    const child = spawn("kubectl", ["get", "platformreposecrets.codeflare.dev", "-A", "--no-headers", "--watch"])

    const sep = /\s+/
    const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent(sep))
    child.stderr.pipe(process.stderr)
    splitter.on("error", console.error)
    splitter.on("close", () => child.kill())
    return splitter
  } catch (err) {
    console.error(err)
    throw err
  }
}
