import Client from "./client"
import type { BucketItem } from "@jay/common/api/s3"

export default async function listObjects(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
): Promise<BucketItem[]> {
  const client = await Client(endpoint, accessKey, secretKey)
  const stream = await client.listObjectsV2(bucket, undefined, true)

  return new Promise((resolve, reject) => {
    const items: BucketItem[] = []
    stream.on("data", function (item) {
      items.push(item)
    })
    stream.on("error", function (err) {
      reject(err)
    })
    stream.on("close", () => resolve(items))
  })
}
