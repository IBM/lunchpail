import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import filterOutMissingCRDs from "./filter-missing-crd-errors"

import type WorkerPoolStatusEvent from "@jay/common/events/WorkerPoolStatusEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `WorkerPoolStatusEvent`
 */
function transformLineToEvent(fieldSep: string) {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      // Splits the string by spaces
      const [ns, workerpool, application, dataset, ready, size, nodeClass, supportsGpu, age, status, reason, message] =
        chunk.toString().split(fieldSep)

      const model: WorkerPoolStatusEvent = {
        timestamp: Date.now(),
        namespace: ns,
        workerpool,
        applications: [application],
        datasets: [dataset],
        nodeClass,
        supportsGpu: /true/i.test(supportsGpu),
        age,
        status,
        reason,
        message,
        ready: parseInt(ready, 10),
        size: parseInt(size, 10),
      }

      callback(null, JSON.stringify(model))
    },
  })
}

const fields = [
  ".metadata.namespace",
  ".metadata.name",
  ".spec.application.name",
  ".spec.dataset",
  ".metadata.annotations.codeflare\\.dev/ready",
  ".spec.workers.count",
  ".spec.workers.size",
  ".spec.workers.supportsGpu",
  ".metadata.creationTimestamp",
  ".metadata.annotations.codeflare\\.dev/status",
  ".metadata.annotations.codeflare\\.dev/reason",
  ".metadata.annotations.codeflare\\.dev/message",
]

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `WorkerPoolStatusEvent` data
 */
export default function startWorkerPoolStatusStream() {
  // Because `message` can be multi-line and have whitespace, we can't
  // use the built-in kubectl formatter. oof. Hence, we use our own
  // field separator `fieldSep` and record separator `recordSep`. The
  // `split2` npm will split the records, and above, in
  // `transformLineToEvent` we split the fields.
  const fieldSep = "|||"
  const recordSep = "####"

  const child = spawn("kubectl", [
    "get",
    "workerpools.codeflare.dev",
    "-A",
    "--no-headers",
    "--watch",
    "-o",
    "jsonpath=" + fields.map((field) => `{${field}}`).join(`{"${fieldSep}"}`) + `{"${fieldSep}${recordSep}"}`,
  ])

  child.stderr.pipe(filterOutMissingCRDs).pipe(process.stderr)

  const splitter = child.stdout.pipe(split2(recordSep)).pipe(transformLineToEvent(fieldSep))
  splitter.once("error", console.error)
  splitter.once("close", () => {
    splitter.off("error", console.error)
    child.kill()
  })
  return splitter
}
