import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { linkToAllDetails } from "@jay/renderer/navigate/details"

import taskqueueProps from "../../taskqueueProps"
import { associatedWorkerPools } from "../../common"

import type Step from "../Step"
import { oopsNoQueue } from "../oops"

const step: Step = {
  id: "Compute",
  variant: (props) => (associatedWorkerPools(props).length > 0 ? "info" : "warning"),
  content: (props, onClick) => {
    const queue = taskqueueProps(props)
    const pools = associatedWorkerPools(props)

    if (!queue) {
      return oopsNoQueue
    } else if (pools.length === 0) {
      return (
        <span>
          No workers assigned, yet.
          <div>
            <LinkToNewPool isInline taskqueue={queue.name} startOrAdd="create" onClick={onClick} />
          </div>
        </span>
      )
    } else {
      return linkToAllDetails("workerpools", pools)
    }
  },
}

export default step
