import type RunEvent from "@jaas/common/events/RunEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

import None from "@jaas/components/None"
import Cells from "@jaas/components/Grid/Cells"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

type Props = { taskqueue: TaskQueueEvent; run: RunEvent }

export function nUnassigned(props: Props) {
  const { context, name, namespace } = props.run.metadata
  const count = parseInt(
    props.taskqueue.metadata.annotations[`jaas.dev/unassigned.${context}.${namespace}.${name}`],
    10,
  )
  return isNaN(count) ? 0 : count
}

function cells(count: number, props: Props) {
  if (!count) {
    return <Cells kind="pending" inbox={{ [props.taskqueue.metadata.name]: 0 }} />
  }
  return <Cells kind="pending" inbox={{ [props.taskqueue.metadata.name]: nUnassigned(props) }} />
}

function storageType(props: Pick<Props, "taskqueue">) {
  const storageType = props.taskqueue.spec.local.type
  return storageType === "COS" ? "S3-based queue" : storageType
}

export default function unassigned(props: Props) {
  const count = nUnassigned(props)
  return descriptionGroup(
    "Unassigned Tasks",
    count === 0 ? None() : cells(count, props),
    count,
    storageType(props),
    "Queue Provider",
  )
}
