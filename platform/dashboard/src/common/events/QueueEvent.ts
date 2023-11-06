import type WithTimestamp from "./WithTimestamp"
import type KubernetesResource from "./KubernetesResource"

/**
 * An update as to the depth of a queue
 */
type QueueEvent = WithTimestamp<
  KubernetesResource<
    "codeflare.dev/v1alpha1",
    "Queue",
    {
      /** Name of DataSet that this queue is helping to process */
      dataset: string
    },
    {
      /** The number of enqueued tasks */
      "codeflare.dev/inbox": string

      /** The number of in-progress tasks */
      "codeflare.dev/processing": string

      /** The number of completed tasks */
      "codeflare.dev/outbox": string
    },
    {
      labels: {
        /** The Run this queue is part of */
        "app.kubernetes.io/part-of": string

        /** The WorkerPool this queue is part of */
        "app.kubernetes.io/name": string

        /** This queue is assigned to the given indexed worker */
        "codeflare.dev/worker-index": string
      }
    }
  >
>

export default QueueEvent
