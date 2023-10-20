import split2 from "split2"
import { Transform } from "stream"
import { spawn } from "child_process"

import filterOutMissingCRDs from "./filter-missing-crd-errors"

import type ApplicationSpecEvent from "@jaas/common/events/ApplicationSpecEvent"

/**
 * @return a NodeJS stream Transform that turns a raw line into a
 * (string-serialized) `ApplicationSpecEvent`
 */
function transformLineToEvent(sep: string) {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      // Splits the string by spaces
      const [ns, application, api, command, supportsGpu, image, repo, description, inputs_stringified, age, status] =
        chunk.toString().split(sep)

      const inputs = inputs_stringified ? JSON.parse(inputs_stringified) : []

      const model: ApplicationSpecEvent = {
        timestamp: Date.now(),
        namespace: ns,
        application,
        description,
        api,
        command,
        supportsGpu: /true/i.test(supportsGpu),
        image,
        repo,
        defaultSize: inputs[0] ? inputs[0].defaultSize /* FIXME as ApplicationSpecEvent["defaultSize"] */ : undefined,
        "data sets": inputs[0] ? inputs[0].sizes : undefined, // FIXME
        age,
        status,
      }

      callback(null, JSON.stringify(model))
    },
  })
}

/**
 * @return a NodeJS `Stream` that emits a stream of serialized `ApplicationSpecEvent` data
 */
export default function startApplicationSpecStream() {
  try {
    const sep = "|||"
    const child = spawn("kubectl", [
      "get",
      "application.codeflare.dev",
      "-A",
      "--no-headers",
      "--watch",
      "-o",
      `jsonpath={.metadata.namespace}{"${sep}"}{.metadata.name}{"${sep}"}{.spec.api}{"${sep}"}{.spec.command}{"${sep}"}{.spec.supportsGpu}{"${sep}"}{.spec.image}{"${sep}"}{.spec.repo}{"${sep}"}{.spec.description}{"${sep}"}{.spec.inputs}{"${sep}"}{.metadata.creationTimestamp}{"${sep}"}{.metadata.annotations.codeflare\\.dev/status}{"${sep}\\n"}`,
    ])

    child.stderr.pipe(filterOutMissingCRDs).pipe(process.stderr)

    const splitter = child.stdout.pipe(split2()).pipe(transformLineToEvent(sep))
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
