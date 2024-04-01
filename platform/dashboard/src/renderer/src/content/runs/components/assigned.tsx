import None from "@jaas/components/None"
import InboxOutboxTable from "@jaas/components/Grid/InboxOutboxTable"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"
import { queueInbox, queueOutbox, queueProcessing, inWorkerPool } from "@jaas/renderer/content/events/QueueEvent"

import { singular as workerpool } from "@jaas/resources/workerpools/name"

type Props = Pick<import("./Props").default, "run" | "workerpools" | "latestQueueEvents">

/** @return Worker `Queues` associated with the given `workerpool` instance */
function associatedQueues(props: Props, workerpool: Props["workerpools"][number]) {
  return props.latestQueueEvents.filter((event) => inWorkerPool(event, workerpool))
}

function associatedWorkerPools(props: Props) {
  return props.workerpools.filter(
    ({ metadata, spec }) => spec.run === props.run.metadata.name && metadata.context === props.run.metadata.context,
  )
}

function zeros(N: number) {
  return Array(N).fill(0)
}

export default function Assigned(props: Props) {
  const workerpools = associatedWorkerPools(props)

  const { inbox, processing, outbox } = workerpools.reduce(
    (M, workerpool, idx) => {
      const { inbox, processing, outbox } = associatedQueues(props, workerpool).reduce(
        (M, queue) => {
          M.inbox += queueInbox(queue)
          M.processing += queueProcessing(queue)
          M.outbox += queueOutbox(queue)
          return M
        },
        { inbox: 0, processing: 0, outbox: 0 },
      )

      M.inbox[idx] = inbox
      M.processing[idx] = processing
      M.outbox[idx] = outbox
      return M
    },
    { inbox: zeros(workerpools.length), processing: zeros(workerpools.length), outbox: zeros(workerpools.length) },
  )

  const nInbox = inbox.reduce((N, value) => N + value, 0)
  const nProcessing = processing.reduce((N, value) => N + value, 0)
  const nComplete = outbox.reduce((N, value) => N + value, 0)
  const nTotal = nInbox + nProcessing + nComplete

  return descriptionGroup(
    `Assigned Tasks (by ${workerpool})`,
    nTotal === 0 ? (
      <None />
    ) : (
      <InboxOutboxTable rowLabelPrefix="P" inbox={inbox} processing={processing} outbox={outbox} />
    ),
    nTotal === 0 ? undefined : `${nComplete} completed`,
    <>
      This view provides a breakdown of the state of <strong>Tasks</strong>. Each <strong>P1</strong>,{" "}
      <strong>P2</strong>, &hellip; shows the <strong>Tasks</strong> assigned to a particular{" "}
      <strong>{workerpool}</strong>.
    </>,
    "Assigned Tasks",
  )
}
