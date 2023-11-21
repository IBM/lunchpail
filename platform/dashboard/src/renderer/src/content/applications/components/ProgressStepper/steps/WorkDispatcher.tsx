import { linkToAllDetails } from "@jay/renderer/navigate/details"

import type Props from "../../Props"
import taskqueueProps from "../../taskqueueProps"
import NewWorkDispatcherButton from "../../actions/NewWorkDispatcher"

import type Step from "../Step"
import { oopsNoQueue } from "../oops"

/** @return the WorkDispatchers associated with `props.application` */
function workdispatchers(props: Props) {
  return props.workdispatchers.filter((_) => _.spec.application === props.application.metadata.name)
}

const step: Step = {
  id: "Work Dispatcher",
  variant: (props) => (workdispatchers(props).length > 0 ? "info" : "warning"),
  content: (props, onClick) => {
    const queue = taskqueueProps(props)
    const dispatchers = workdispatchers(props)

    if (!queue) {
      return oopsNoQueue
    } else if (dispatchers.length === 0) {
      return (
        <span>
          You will need specify how to feed the task queue.{" "}
          <div>
            <NewWorkDispatcherButton isInline {...props} queueProps={queue} onClick={onClick} />
          </div>
        </span>
      )
    } else {
      return linkToAllDetails("workdispatchers", dispatchers)
    }
  },
}

export default step
