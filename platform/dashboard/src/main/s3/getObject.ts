import Client from "./client"

export default async function getObjects(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
  object: string,
): Promise<string> {
  const client = await Client(endpoint, accessKey, secretKey)
  const stream = await client.getObject(bucket, object)

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
