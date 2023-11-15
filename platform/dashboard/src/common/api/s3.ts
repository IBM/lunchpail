/**
 * S3 API
 */
export default interface S3Api {
  /** @return list of buckets for the given s3 accessKey */
  listBuckets(endpoint: string, accessKey: string, secretKey: string): Promise<Bucket[]>

  /** @return list of objects in the given s3 bucket */
  listObjects(endpoint: string, accessKey: string, secretKey: string, bucket: string): Promise<BucketItem[]>

  /** @return object content */
  getObject(endpoint: string, accessKey: string, secretKey: string, bucket: string, object: string): Promise<string>
}

export type Bucket = { name: string; creationDate: Date }
export type BucketItem = { name?: string; prefix?: string; size: number; lastModified?: Date }
