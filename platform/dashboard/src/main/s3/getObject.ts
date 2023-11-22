import Client from "./client"

export default async function getObjects(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
  object: string,
  offset = 0, // start at the beginning
  limit = 1024 * 10, // default limit of 10 kilobytes
): Promise<string> {
  const noOffset = offset === undefined || offset <= 0
  const noLimit = limit === undefined || limit <= 0

  const client = await Client(endpoint, accessKey, secretKey)
  const stream = await (noOffset && noLimit
    ? client.getObject(bucket, object)
    : noLimit
      ? client.getPartialObject(bucket, object, offset)
      : client.getPartialObject(bucket, object, offset, limit))

  return new Promise((resolve, reject) => {
    let content = ""
    stream.on("data", function (chunk) {
      content += chunk
    })
    stream.on("error", function (err) {
      reject(err)
    })
    stream.on("close", () => resolve(content))
  })
}
