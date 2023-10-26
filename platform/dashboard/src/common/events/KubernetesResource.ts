export default interface KubernetesResource<Spec, Annotations = unknown, Labels = unknown> {
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
