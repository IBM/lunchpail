import split2 from "split2"
import { spawn } from "child_process"
import { EventEmitter } from "events"

import transformToJSON from "./json-transformer"
import filterOutMissingCRDs from "./filter-missing-crd-errors"

// This will need to be adjusted as we add more resources Kinds to track */
EventEmitter.defaultMaxListeners = 30

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `ApplicationSpecEvent` data
 */
export default function startStreamForKind(kind: string, withTimestamp = false) {
  try {
    const child = spawn("kubectl", ["get", kind, "-A", "--no-headers", "--watch", "-o=json"])

    // pipe transformers
    const errorFilter = filterOutMissingCRDs()
    const toJson = transformToJSON(withTimestamp)
    const lineSplitter = split2()

    child.stderr.pipe(errorFilter).pipe(process.stderr)

    return child.stdout
      .pipe(lineSplitter)
      .pipe(toJson)
      .once("close", () => {
        toJson.destroy()
        errorFilter.destroy()
        lineSplitter.destroy()
        child.kill()
      })
  } catch (err) {
    console.error(err)
    throw err
  }
}
