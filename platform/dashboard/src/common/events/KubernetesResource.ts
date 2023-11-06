type KubernetesResource<
  ApiVersion extends string = string,
  Kind extends string = string,
  Spec = unknown,
  Annotations = unknown,
  Labels = unknown,
  Top = unknown,
> = Top & {
  apiVersion: ApiVersion
  kind: Kind

  /** Resource metadata */
  metadata: Labels & {
    /** Resource name */
    name: string

    /** Resource namespace */
    namespace: string

    /** Age of resource */
    creationTimestamp: string

    /** Resource annotations */
    annotations: Annotations & {
      /** Status of Resource (TODO) */
      "codeflare.dev/status": string

      /** Coded reason for failure (TODO) */
      "codeflare.dev/reason"?: string

      /** Error message (TODO) */
      "codeflare.dev/message"?: string
    }
  }

  /** Resource spec */
  spec: Spec
}

export type KubernetesSecret<Data> = KubernetesResource<"v1", "Secret", unknown, unknown, unknown, { data: Data }>
export type KubernetesS3Secret = KubernetesSecret<{ accessKeyID: string; secretAccessKey: string }>

export default KubernetesResource
