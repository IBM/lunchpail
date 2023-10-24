import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import type TaskSimulatorEvent from "@jay/common/events/TaskSimulatorEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `TaskSimulatorEvent`
 */
function transformLineToEvent(fieldSep: RegExp) {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      // Splits the string by spaces
      const [ns, name, dataset, status, age] = chunk.toString().split(fieldSep)

      const model: TaskSimulatorEvent = {
        timestamp: Date.now(),
        namespace: ns,
        name,
        dataset,
        age,
        status,
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `TaskSimulatorEvent` data
 */
export default function startTaskSimulatorStream() {
  const fieldSep = /\s+/
  const child = spawn("kubectl", ["get", "tasksimulators.codeflare.dev", "-A", "--no-headers", "--watch"])

  const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent(fieldSep))
  splitter.once("error", console.error)
  splitter.once("close", () => {
    splitter.off("error", console.error)
    child.kill()
  })
  return splitter
}
