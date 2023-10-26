export default interface KubernetesResource<Spec> {
  metadata: {
    name: string
    namespace: string

    /** Age of resource */
    creationTimestamp: string

    annotations: {
      /** Status of Resource (TODO) */
      "codeflare.dev/status": string

      /** Coded reason for failure (TODO) */
      "codeflare.dev/reason"?: string

      /** Error message (TODO) */
      "codeflare.dev/message"?: string

      /** Ready count (TODO) */
      "codeflare.dev/ready"?: string
    }
  }

  spec: Spec
}
