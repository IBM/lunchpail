export default async function getObjects(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
  object: string,
): Promise<string> {
  const { Client } = await import("minio")
  const s3Client = new Client({
    endPoint: endpoint.replace(/^https?:\/\//, ""),
    accessKey,
    secretKey,
  })

  const stream = await s3Client.getObject(bucket, object)

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
