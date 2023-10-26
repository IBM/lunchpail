import split2 from "split2"
import { spawn } from "child_process"

import transformToJSON from "./json-transformer"
import filterOutMissingCRDs from "./filter-missing-crd-errors"

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `ApplicationSpecEvent` data
 */
export default function startStreamForKind(kind: string) {
  try {
    const child = spawn("kubectl", ["get", kind, "-A", "--no-headers", "--watch", "-o=json"])

    child.stderr.pipe(filterOutMissingCRDs).pipe(process.stderr)

    const splitter = child.stdout.pipe(split2()).pipe(transformToJSON())
    splitter.once("error", console.error)
    splitter.once("close", () => {
      splitter.off("error", console.error)
      child.kill()
    })
    return splitter
  } catch (err) {
    console.error(err)
    throw err
  }
}
