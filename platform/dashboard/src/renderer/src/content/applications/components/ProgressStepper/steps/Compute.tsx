import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { linkToAllDetails } from "@jay/renderer/navigate/details"

import taskqueueProps from "../../taskqueueProps"
import { associatedWorkerPools } from "../../common"

import type Step from "../Step"
import { oopsNoQueue } from "../oops"

const step: Step = {
  id: "Compute",
  variant: (props) => (associatedWorkerPools(props).length > 0 ? "success" : "warning"),
  content: (props, onClick) => {
    const queue = taskqueueProps(props)
    const pools = associatedWorkerPools(props)

    if (!queue) {
      return oopsNoQueue
    } else if (pools.length === 0) {
      const body = "No workers assigned, yet."
      const footer = <LinkToNewPool isInline taskqueue={queue.name} startOrAdd="create" onClick={onClick} />
      return { body, footer }
    } else {
      return linkToAllDetails("workerpools", pools)
    }
  },
}

export default step
