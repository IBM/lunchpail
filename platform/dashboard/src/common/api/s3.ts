/**
 * S3 API
 */
export default interface S3Api {
  /** @return list of available AWS-style profiles */
  listProfiles(): Promise<Profile[]>

  /** @return list of buckets for the given s3 accessKey */
  listBuckets(endpoint: string, accessKey: string, secretKey: string): Promise<Bucket[]>

  /** @return list of objects in the given s3 bucket */
  listObjects(endpoint: string, accessKey: string, secretKey: string, bucket: string): Promise<BucketItem[]>

  /**
   * If `offset` is not provided or `offset<=0` then the the object
   * will be fetched from the first byte. If `limit` is not provided,
   * then the first 10 kilobytes of the object will be fetched.
   *
   * @return content of the given `object` in the given `bucket`, optionally segmented by `offset` and `length`
   */
  getObject(
    endpoint: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
    object: string,
    offset?: number,
    limit?: number,
  ): Promise<string>
}

export type Bucket = { name: string; creationDate: Date }
export type BucketItem = { name?: string; prefix?: string; size: number; lastModified?: Date }
export type Profile = { name: string; endpoint: string; accessKey: string; secretKey: string }
