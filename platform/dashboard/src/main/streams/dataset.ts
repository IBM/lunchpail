import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

// FIXME import type DataSetModel from "../../renderer/src/components/DataSetModel"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `DataSetModel`
 */
function transformLineToEvent() {
  return new Transform({
    transform(chunk, _, callback) {
      // Splits the string by spaces
      const [, label, storageType, endpoint, bucket, isReadOnly, inbox] = chunk.toString().split(/\s+/)

      if (inbox === "") {
        callback(null, "")
      } else {
        const model /* FIXME : DataSetModel */ = {
          inbox: parseInt(inbox, 10),
          outbox: 0,
          label,
          storageType,
          endpoint,
          bucket,
          isReadOnly: isReadOnly === "true",
          timestamp: Date.now(),
        }

        callback(null, JSON.stringify(model))
      }
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `DataSetModel` data
 */
export default function startDataSetStream() {
  // TODO: manage the child process?
  const child = spawn("kubectl", ["get", "dataset", "-A", "--no-headers", "--watch"])
  const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent())
  splitter.on("error", console.error)
  splitter.on("close", () => child.kill())
  return splitter
}
