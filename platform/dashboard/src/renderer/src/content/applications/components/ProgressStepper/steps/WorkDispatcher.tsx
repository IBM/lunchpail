import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import taskqueueProps from "../../taskqueueProps"
import NewWorkDispatcherButton from "../../actions/NewWorkDispatcher"

import type Step from "../Step"
import { oopsNoQueue } from "../oops"
import workdispatchers from "../../workdispatchers"

import { status } from "@jaas/resources/workdispatchers/status"
import { name as workerpools } from "@jaas/resources/workerpools/name"
import { singular as taskqueueSingular } from "@jaas/resources/taskqueues/name"
import { singular as workdispatcherSingular } from "@jaas/resources/workdispatchers/name"

function statusOfDispatchers(props: import("../../Props").default) {
  const all = workdispatchers(props)

  const pending = all.filter((_) => /Pend/i.test(status(_))).length
  const running = all.filter((_) => /Run/i.test(status(_))).length
  const finished = all.filter((_) => /Succe/i.test(status(_))).length
  const failed = all.filter((_) => /Fail/i.test(status(_))).length

  return { pending, running, finished, failed }
}

function variant(props: import("../../Props").default) {
  const { pending, running, finished, failed } = statusOfDispatchers(props)

  return pending + running + finished + failed === 0
    ? ("warning" as const)
    : failed > 0
      ? ("danger" as const)
      : pending > 0
        ? ("pending" as const)
        : running > 0
          ? ("info" as const)
          : ("success" as const)
}

const step: Step = {
  id: workdispatcherSingular,
  variant,
  content: (props, onClick) => {
    const queue = taskqueueProps(props)
    const dispatchers = workdispatchers(props)

    if (!queue) {
      return oopsNoQueue
    } else if (dispatchers.length === 0) {
      const body = (
        <span>
          You will need specify how to feed the {taskqueueSingular}. Once created, a{" "}
          <strong>{workdispatcherSingular}</strong> will populate the queue, and any assigned{" "}
          <strong>{workerpools}</strong> will then consume work from the queue.{" "}
        </span>
      )

      const footer = <NewWorkDispatcherButton isInline {...props} queueProps={queue} onClick={onClick} />

      return { body, footer }
    } else {
      return linkToAllDetails("workdispatchers", dispatchers)
    }
  },
}

export default step
