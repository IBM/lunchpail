import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

// FIXME import type WorkerPoolStatusEvent from "../../renderer/src/events/WorkerPoolStatusEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `WorkerPoolStatusEvent`
 */
function transformLineToEvent() {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      // Splits the string by spaces
      const [ns, workerpool, application, dataset, ready, size, nodeClass, supportsGpu, age, status] = chunk
        .toString()
        .split(/\s+/)

      const model /* FIXME : WorkerPoolStatusEvent */ = {
        timestamp: Date.now(),
        namespace: ns,
        workerpool,
        applications: [application],
        datasets: [dataset],
        nodeClass,
        supportsGpu: /true/i.test(supportsGpu),
        age,
        status,
        ready: parseInt(ready, 10),
        size: parseInt(size, 10),
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `WorkerPoolStatusEvent` data
 */
export default function startWorkerPoolStatusStream() {
  const child = spawn("kubectl", ["get", "workerpool", "-A", "--no-headers", "--watch"])
  const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent())
  splitter.on("error", console.error)
  splitter.on("close", () => child.kill())
  return splitter
}
