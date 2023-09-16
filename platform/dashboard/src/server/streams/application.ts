import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import type ApplicationSpecEvent from "../../client/events/ApplicationSpecEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `ApplicationSpecEvent`
 */
function transformLineToEvent() {
  return new Transform({
    transform(chunk: Buffer, encoding: string, callback) {
      // Splits the string by spaces
      const [ns, application, api, image, command, supportsGpu, age] = chunk.toString().split(/\s+/)

      const model: ApplicationSpecEvent = {
        timestamp: Date.now(),
        ns,
        application,
        api,
        image,
        command,
        supportsGpu: /true/i.test(supportsGpu),
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
  const child = spawn("kubectl", ["get", "application.codeflare.dev", "-A", "--no-headers", "--watch"])
  const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent())
  splitter.on("error", console.error)
  splitter.on("close", () => child.kill())
  return splitter
}
