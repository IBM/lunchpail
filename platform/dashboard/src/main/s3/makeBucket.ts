import Client from "./client"

/** Make a bucket */
export default async function makeBucket(
  endpoint: string,
  accessKey: string,
  secretKey: string,
  bucket: string,
): Promise<void> {
  const client = await Client(endpoint, accessKey, secretKey)
  return client.makeBucket(endpoint, bucket)
}
