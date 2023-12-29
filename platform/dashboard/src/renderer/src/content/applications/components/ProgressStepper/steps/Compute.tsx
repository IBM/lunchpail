import { LinkToNewPool } from "@jay/renderer/navigate/newpool"
import { linkToAllDetails } from "@jay/renderer/navigate/details"

import taskqueueProps from "../../taskqueueProps"

import { singular as workerpool } from "@jay/resources/workerpools/name"
import { groupSingular as application } from "@jay/resources/applications/group"

import type Step from "../Step"
import type Props from "../../Props"
import { oopsNoQueue } from "../oops"

function associatedWorkerPools(props: Props) {
  return props.workerpools.filter((_) => _.spec.application.name === props.application.metadata.name)
}

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
