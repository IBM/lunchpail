import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import type ApplicationSpecEvent from "../../client/events/ApplicationSpecEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `ApplicationSpecEvent`
 */
function transformLineToEvent(sep: string) {
  return new Transform({
    transform(chunk: Buffer, encoding: string, callback) {
      // Splits the string by spaces
      const [ns, application, api, command, supportsGpu, image, repo, description, age] = chunk.toString().split(sep)

      const model: ApplicationSpecEvent = {
        timestamp: Date.now(),
        namespace: ns,
        application,
        description,
        api,
        command,
        supportsGpu: /true/i.test(supportsGpu),
        image,
        repo,
        age,
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `ApplicationSpecEvent` data
 */
export default function startApplicationSpecStream() {
  try {
    const sep = "|||"
    const child = spawn("kubectl", [
      "get",
      "application.codeflare.dev",
      "-A",
      "--no-headers",
      "--watch",
      "-o",
      `jsonpath={.metadata.namespace}{"${sep}"}{.metadata.name}{"${sep}"}{.spec.api}{"${sep}"}{.spec.command}{"${sep}"}{.spec.supportsGpu}{"${sep}"}{.spec.image}{"${sep}"}{.spec.repo}{"${sep}"}{.spec.description}{"${sep}"}{.metadata.creationTimestamp}{"${sep}\\n"}`,
    ])

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
