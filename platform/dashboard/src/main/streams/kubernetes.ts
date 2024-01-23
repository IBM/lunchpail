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

/** Any subprocesses that we want to kill on process exit? */
let cleanupsOnProcessExit: null | (() => void)[] = null

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

  const onError = (err) => {
    if (/ENOENT/.test(String(err))) {
      console.error("kubectl not found")
    } else {
      console.error(err)
    }
  }
  child.once("error", onError)

  const cleanup = () => {
    toJson.destroy()
    errorFilter.destroy()
    lineSplitter.destroy()
    child.off("error", onError)
    child.kill()

    // remove our cleanup from the process.exit list
    if (cleanupsOnProcessExit) {
      const idx = cleanupsOnProcessExit.findIndex((_) => _ === cleanup)
      if (idx >= 0) {
        cleanupsOnProcessExit.splice(idx, 1)
      }
    }
  }

  if (!cleanupsOnProcessExit) {
    cleanupsOnProcessExit = []
    process.once("exit", () => {
      if (cleanupsOnProcessExit) {
        cleanupsOnProcessExit.forEach((cleanup) => cleanup())
      }
    })
  }
  cleanupsOnProcessExit.push(cleanup)

  return child.stdout.pipe(lineSplitter).pipe(toJson).once("close", cleanup)
}
