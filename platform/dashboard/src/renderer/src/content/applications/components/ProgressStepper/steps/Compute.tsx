import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { linkToAllDetails } from "@jay/renderer/navigate/details"

import taskqueueProps from "../../taskqueueProps"
import { associatedWorkerPools } from "../../common"

import { groupSingular as application } from "../../../group"
import { singular as workerpool } from "../../../../workerpools/name"

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
      const body = (
        <span>
          No workers have been assigned to this <strong>{application}</strong>. Once you configure a{" "}
          <strong>Compute {workerpool}</strong>, the workers will begin to process any queued-up Tasks.
        </span>
      )
      const footer = <LinkToNewPool isInline taskqueue={queue.name} startOrAdd="create" onClick={onClick} />
      return { body, footer }
    } else {
      return linkToAllDetails("workerpools", pools)
    }
  },
}

export default step
