import split2 from "split2"
import { spawn } from "node:child_process"
import { Transform } from "node:stream"

/**
 * Strip down the kubectl logs prefix to show just the container name
 */
function reformatPrefixToShowJustContainer() {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      callback(
        null,
        chunk.toString().replace(/^\[pod\/[^/]+\/([^\]]+)\] (.+)$/g, (_, prefix, rest) => {
          if (rest[0] === "[") {
            return rest + "\n"
          } else {
            return `[${prefix}] ${rest}\n`
          }
        }),
      )
    },
  })
}

/**
 * @return a NodeJS `Readable` for the logs of the resources specified
 * by the label `selector` in the given `namespace`.
 */
export default async function logs(selector: string | string[], namespace: string, follow = false) {
  const mergeStreams = await import("@sindresorhus/merge-streams").then((_) => _.default)

  try {
    const selectors = typeof selector === "string" ? [selector] : selector

    const streams = selectors.map((selector) => {
      const child = spawn("kubectl", [
        "logs",
        "--all-containers",
        "--prefix",
        "-l",
        selector,
        "--tail=-1",
        "-n",
        namespace,
        follow ? "-f" : "",
      ])

      child.stderr.pipe(process.stderr)
      return child.stdout
        .pipe(split2())
        .pipe(reformatPrefixToShowJustContainer())
        .once("close", () => child.kill())
    })

    return {
      stream: mergeStreams(streams),
      close: () => streams.forEach((_) => _.destroy()),
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}
