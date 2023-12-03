import split2 from "split2"
import { spawn } from "node:child_process"
import { Transform } from "node:stream"

/**
 * Strip down the kubectl logs prefix to show just the container name
 */
function reformatPrefixToShowJustContainer(chalk: import("chalk").ChalkInstance) {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      callback(
        null,
        // e.g. [pod/podName/containerName] [maybeAltPrefix] rest
        chunk
          .toString()
          .replace(/^\[pod\/[^/]+\/([^\]]+)\] (\[[^\]]+\] )?(.+)$/g, (_, containerName, maybeAltPrefix, rest) => {
            if (maybeAltPrefix) {
              // then the log line has its own [...] prefix
              return chalk.dim.blue.bold(`${maybeAltPrefix}`) + `${rest}\n`
            } else {
              // otherwise, use the [...] prefix that kbuectl --prefix
              // gives us, except we want to strip off the length prefix
              // and use only the trailing container name
              return chalk.dim.blue.bold(`[${containerName}]`) + ` ${rest}\n`
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
export default async function logs(selector: string, namespace: string, follow = false) {
  const [chalk, mergeStreams] = await Promise.all([
    import("chalk").then((_) => _.default),
    import("@sindresorhus/merge-streams").then((_) => _.default),
  ])

  try {
    // ":" is the splitter we use to support multiple disjunctive selectors
    const selectors = selector.split(/:/)

    const streams = selectors.map((selector) => {
      const child = spawn("kubectl", [
        "logs",
        // "--all-containers",
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
        .pipe(reformatPrefixToShowJustContainer(chalk))
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
