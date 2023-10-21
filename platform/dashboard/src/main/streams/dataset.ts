import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import filterOutMissingCRDs from "./filter-missing-crd-errors"

import type DataSetEvent from "@jay/common/events/DataSetEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `DataSetModel`
 */
function transformLineToEvent() {
  return new Transform({
    transform(chunk, _, callback) {
      // Splits the string by spaces
      const [, label, storageType, endpoint, bucket, inbox, status, isReadOnly] = chunk.toString().split(/\s+/)

      const model: DataSetEvent = {
        inbox: parseInt(inbox, 10),
        outbox: 0,
        label,
        storageType,
        endpoint,
        bucket,
        status,
        isReadOnly: isReadOnly === "true",
        timestamp: Date.now(),
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `DataSetModel` data
 */
export default function startDataSetStream() {
  // TODO: manage the child process?
  const child = spawn("kubectl", ["get", "dataset", "-A", "--no-headers", "--watch"])
  child.stderr.pipe(filterOutMissingCRDs).pipe(process.stderr)

  const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent())
  splitter.once("error", console.error)
  splitter.once("close", () => {
    splitter.off("error", console.error)
    child.kill()
  })
  return splitter
}
