import Client from "./client"

export default async function listBuckets(endpoint: string, accessKey: string, secretKey: string) {
  const client = await Client(endpoint, accessKey, secretKey)
  return client.listBuckets()
}
