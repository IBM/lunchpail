type S3Props = { endpoint: string; bucket: string; accessKey: string; secretKey: string } & Pick<
  Required<typeof window.jaas>,
  "s3"
>

export default S3Props
