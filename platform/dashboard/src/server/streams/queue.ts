import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import type QueueEvent from "../../client/events/QueueEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `QueueEvent`
 */
function transformLineToEvent() {
  return new Transform({
    transform(chunk: Buffer, encoding: string, callback) {
      // Splits the string by spaces
      const [, queue, run, workerpool, workerIndex, inbox, processing, outbox] = chunk.toString().split(/\s+/)

      // FIXME HACK
      // e.g. queue = queue-test7-test7data-0
      //      run = test7
      const dataset = queue.replace(`queue-${run}-`, "").replace(/-\d+$/, "")

      const model: QueueEvent = {
        timestamp: Date.now(),
        run,
        inbox: parseInt(inbox, 10),
        outbox: parseInt(outbox, 10),
        processing: parseInt(processing, 10),
        workerIndex: parseInt(workerIndex, 10),
        workerpool,
        dataset,
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `QueueEvent` data
 */
export default function startQueueStream() {
  const child = spawn("kubectl", ["get", "queue", "-A", "--no-headers", "--watch"])
  const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent())
  splitter.on("error", console.error)
  splitter.on("close", () => child.kill())
  return splitter
}
