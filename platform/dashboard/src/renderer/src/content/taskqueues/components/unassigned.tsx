import type RunEvent from "@jaas/common/events/RunEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

import None from "@jaas/components/None"
import Cells from "@jaas/components/Grid/Cells"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

type Props = { taskqueue: TaskQueueEvent; run: RunEvent }

type State = "done" | "unassigned"

/** @return number of tasks in the given `State` */
function numInState(props: Props, state: State) {
  const { context, name, namespace } = props.run.metadata
  // e.g. jaas.dev/unassigned....
  const count = parseInt(props.taskqueue.metadata.annotations[`jaas.dev/${state}.${context}.${namespace}.${name}`], 10)
  return isNaN(count) ? 0 : count
}

/** @return number of tasks with `State=unassigned` */
export function nUnassigned(props: Props) {
  return numInState(props, "unassigned")
}

/** @return number of tasks with `State=done` */
export function nDone(props: Props) {
  return numInState(props, "done")
}

/** @return React component that visualizes `count` tasks in the given `state` */
function cells(count: number, state: State, props: Props) {
  const kind = state === "unassigned" ? "pending" : "running"

  if (!count) {
    return <Cells kind={kind} inbox={{ [props.taskqueue.metadata.name]: 0 }} />
  }
  return <Cells kind={kind} inbox={{ [props.taskqueue.metadata.name]: count }} />
}

function groupForState(props: Props, state: State) {
  const count = numInState(props, state)
  return descriptionGroup(
    `${state} Tasks`,
    count === 0 ? None() : cells(count, state, props),
    count,
    state === "unassigned" ? (
      <>
        These <strong>Tasks</strong> have yet to be assigned to any particular <strong>Worker</strong>.
      </>
    ) : (
      <>
        These <strong>Tasks</strong> are complete, having been fully processed by a <strong>Worker</strong>.
      </>
    ),
  )
}

export function unassigned(props: Props) {
  return groupForState(props, "unassigned")
}

export function done(props: Props) {
  return groupForState(props, "done")
}
