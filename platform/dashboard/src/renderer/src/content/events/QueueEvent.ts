import QueueEvent from "@jaas/common/events/QueueEvent"
import WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

export function queueInbox({ event }: QueueEvent) {
  return parseInt(event.metadata.annotations["codeflare.dev/inbox"], 10)
}

export function queueProcessing({ event }: QueueEvent) {
  return parseInt(event.metadata.annotations["codeflare.dev/processing"], 10)
}

export function queueOutbox({ event }: QueueEvent) {
  return parseInt(event.metadata.annotations["codeflare.dev/outbox"], 10)
}

export function queueWorkerIndex({ event }: QueueEvent) {
  return parseInt(event.metadata.labels["codeflare.dev/worker-index"], 10)
}

export function queueRun({ event }: QueueEvent) {
  return event.metadata.labels["app.kubernets.io/part-of"]
}

export function queueWorkerPool({ event }: QueueEvent) {
  return event.metadata.labels["app.kubernetes.io/name"]
}

export function queueTaskQueue({ event }: QueueEvent) {
  // FIXME HACK
  // e.g. queue = queue-test7-test7data-0
  //      run = test7
  //const run = queueRun(queue)
  //return queue.event.metadata.name.replace(`queue-${run}-`, "").replace(/-\d+$/, "")
  return event.spec.dataset
}

export function inWorkerPool(qe: QueueEvent, workerpool: WorkerPoolStatusEvent) {
  return (
    queueWorkerPool(qe) === workerpool.metadata.name &&
    qe.event.metadata.namespace === workerpool.metadata.namespace &&
    workerpool.metadata.context === workerpool.metadata.context
  )
}
