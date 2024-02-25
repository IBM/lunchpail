import type RunEvent from "@jaas/common/events/RunEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

import None from "@jaas/components/None"
import Cells from "@jaas/components/Grid/Cells"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import { singular as TaskQueue } from "@jaas/resources/taskqueues/name"

type Props = { taskqueue: TaskQueueEvent; run: RunEvent }

type State = "done" | "unassigned"

function numInState(props: Props, state: State) {
  const { context, name, namespace } = props.run.metadata
  // e.g. jaas.dev/unassigned....
  const count = parseInt(props.taskqueue.metadata.annotations[`jaas.dev/${state}.${context}.${namespace}.${name}`], 10)
  return isNaN(count) ? 0 : count
}

export function nUnassigned(props: Props) {
  return numInState(props, "unassigned")
}

export function nDone(props: Props) {
  return numInState(props, "done")
}

function cells(count: number, state: State, props: Props) {
  const kind = state === "unassigned" ? "pending" : "running"

  if (!count) {
    return <Cells kind={kind} inbox={{ [props.taskqueue.metadata.name]: 0 }} />
  }
  return <Cells kind={kind} inbox={{ [props.taskqueue.metadata.name]: count }} />
}

function storageType(props: Pick<Props, "taskqueue">) {
  const storageType = props.taskqueue.spec.local.type
  return storageType === "COS" ? `This ${TaskQueue} uses S3` : storageType
}

function groupForState(props: Props, state: State) {
  const count = numInState(props, state)
  return descriptionGroup(
    `${state} Tasks`,
    count === 0 ? None() : cells(count, state, props),
    count,
    storageType(props),
    TaskQueue,
  )
}

export function unassigned(props: Props) {
  return groupForState(props, "unassigned")
}

export function done(props: Props) {
  return groupForState(props, "done")
}
