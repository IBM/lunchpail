import type Props from "./Props"
import { lastEvent } from "./common"

import None from "@jay/components/None"
import Cells from "@jay/components/Grid/Cells"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

export function nUnassigned(props: Props) {
  const last = lastEvent(props)
  const count = last ? parseInt(last.metadata.annotations["codeflare.dev/unassigned"], 10) : 0
  return isNaN(count) ? 0 : count
}

function cells(count: number, props: Props) {
  const taskqueueIndex = { [props.name]: 2 }
  if (!count) {
    return <Cells inbox={{ [props.name]: 0 }} taskqueueIndex={taskqueueIndex} />
  }
  return <Cells inbox={{ [props.name]: nUnassigned(props) }} taskqueueIndex={taskqueueIndex} />
}

function storageType(props: Props) {
  const last = lastEvent(props)
  if (last) {
    const storageType = last.spec.local.type
    return storageType === "COS" ? "S3-based queue" : storageType
  } else {
    return undefined
  }
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
