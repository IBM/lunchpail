import type { PropsSummary as Props } from "./Props"

import None from "@jaas/components/None"
import Cells from "@jaas/components/Grid/Cells"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

export function nUnassigned(props: Pick<Props, "taskqueue">) {
  const count = parseInt(props.taskqueue.metadata.annotations["codeflare.dev/unassigned"], 10)
  return isNaN(count) ? 0 : count
}

function cells(count: number, props: Pick<Props, "taskqueue">) {
  const taskqueueIndex = { [props.taskqueue.metadata.name]: 2 }
  if (!count) {
    return <Cells inbox={{ [props.taskqueue.metadata.name]: 0 }} taskqueueIndex={taskqueueIndex} />
  }
  return <Cells inbox={{ [props.taskqueue.metadata.name]: nUnassigned(props) }} taskqueueIndex={taskqueueIndex} />
}

function storageType(props: Pick<Props, "taskqueue">) {
  const storageType = props.taskqueue.spec.local.type
  return storageType === "COS" ? "S3-based queue" : storageType
}

export default function unassigned(props: Pick<Props, "taskqueue">) {
  const count = nUnassigned(props)
  return descriptionGroup(
    "Unassigned Tasks",
    count === 0 ? None() : cells(count, props),
    count,
    storageType(props),
    "Queue Provider",
  )
}
