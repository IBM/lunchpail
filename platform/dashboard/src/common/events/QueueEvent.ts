import type WithTimestamp from "./WithTimestamp"
import type KubernetesResource from "./KubernetesResource"

/**
 * An update as to the depth of a queue
 */
type QueueEvent = WithTimestamp<
  KubernetesResource<
    "lunchpail.io/v1alpha1",
    "Queue",
    {
      /** Name of DataSet that this queue is helping to process */
      dataset: string
    },
    {
      /** The number of enqueued tasks */
      "lunchpail.io/inbox": string

      /** The number of in-progress tasks */
      "lunchpail.io/processing": string

      /** The number of completed tasks */
      "lunchpail.io/outbox": string
    },
    {
      labels: {
        /** The Run this queue is part of */
        "app.kubernetes.io/part-of": string

        /** The WorkerPool this queue is part of */
        "app.kubernetes.io/name": string

        /** This queue is assigned to the given indexed worker */
        "lunchpail.io/worker-index": string
      }
    }
  >
>

export default QueueEvent
