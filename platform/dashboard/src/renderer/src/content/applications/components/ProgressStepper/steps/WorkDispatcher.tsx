import { linkToAllDetails } from "@jay/renderer/navigate/details"

import type Props from "../../Props"
import taskqueueProps from "../../taskqueueProps"
import NewWorkDispatcherButton from "../../actions/NewWorkDispatcher"

import type Step from "../Step"
import { oopsNoQueue } from "../oops"

import { name as workerpools } from "../../../../workerpools/name"
import { singular as workdispatcherSingular } from "../../../../workdispatchers/name"

/** @return the WorkDispatchers associated with `props.application` */
function workdispatchers(props: Props) {
  return props.workdispatchers.filter((_) => _.spec.application === props.application.metadata.name)
}

const step: Step = {
  id: workdispatcherSingular,
  variant: (props) => (workdispatchers(props).length > 0 ? "info" : "warning"),
  content: (props, onClick) => {
    const queue = taskqueueProps(props)
    const dispatchers = workdispatchers(props)

    if (!queue) {
      return oopsNoQueue
    } else if (dispatchers.length === 0) {
      const body = (
        <span>
          You will need specify how to feed the task queue. Once created, a <strong>{workdispatcherSingular}</strong>{" "}
          will populate the queue, and any assigned <strong>{workerpools}</strong> will then consume work from the
          queue.{" "}
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
