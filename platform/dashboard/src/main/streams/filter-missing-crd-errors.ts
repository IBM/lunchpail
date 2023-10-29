import { Transform } from "stream"

/**
 * Because kubectl fails fast when watching for resources of a given
 * Kind, when that Kind does not exist, we do polling in
 * event.ts. However, we don't want to repeatedly log that CRDs are
 * missing. This is a `stream.Transformer` that will filter out those
 * messages.
 */
export default function filterOutMissingCRDs() {
  return new Transform({
    transform(chunk: Buffer, _: string, callback) {
      if (chunk.indexOf("error: the server doesn't have a resource type") < 0) {
        callback(null, chunk)
      } else {
        callback(null, "")
      }
    },
  })
}
