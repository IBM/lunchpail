import split2 from "split2"
import { spawn } from "node:child_process"
import { EventEmitter } from "node:events"

import transformToJSON from "./json-transformer"
import filterOutMissingCRDs from "./filter-missing-crd-errors"

// This will need to be adjusted as we add more resources Kinds to track */
EventEmitter.defaultMaxListeners = 90

type Props = {
  /** At to the event stream the timestamp each event was received */
  withTimestamp: boolean

  /** Label selector to filter events */
  selectors: string[]
}

/**
 * @return a NodeJS `Readable` that emits a stream of serialized JSON
 * Kubernetes resource models (each one marking some change in the
 * model), e.g. a stream of serialized `ApplicationSpecEvent`
 */
export default async function startStreamForKind(
  kind: string,
  context: string,
  { withTimestamp = false, selectors }: Partial<Props> = {},
) {
  const child = spawn("kubectl", [
    "get",
    kind,
    "--context",
    context,
    "-A",
    "--watch",
    "-o=json",
    ...(selectors ? ["-l", selectors.join(",")] : []),
  ])

  // pipe transformers
  const errorFilter = filterOutMissingCRDs()
  const toJson = transformToJSON(context, withTimestamp)
  const lineSplitter = split2()

  child.stderr.pipe(errorFilter).pipe(process.stderr)
  child.once("error", (err) => {
    if (/ENOENT/.test(String(err))) {
      console.error("kubectl not found")
    } else {
      console.error(err)
    }
  })

  const cleanup = () => {
    toJson.destroy()
    errorFilter.destroy()
    lineSplitter.destroy()
    child.kill()
  }
  process.on("exit", cleanup)

  return child.stdout.pipe(lineSplitter).pipe(toJson).once("close", cleanup)
}
