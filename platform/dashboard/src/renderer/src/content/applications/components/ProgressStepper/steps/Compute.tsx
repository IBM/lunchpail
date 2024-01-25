import { Stack } from "@patternfly/react-core"
import { LinkToNewPool } from "@jaas/renderer/navigate/newpool"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import taskqueueProps from "../../taskqueueProps"

import { groupSingular as application } from "@jaas/resources/applications/group"
import { name as workerpools, singular as workerpool } from "@jaas/resources/workerpools/name"

import type Step from "../Step"
import type Props from "../../Props"
import { oopsNoQueue } from "../oops"

function associatedWorkerPools(props: Props) {
  return props.workerpools.filter((_) => _.spec.application.name === props.application.metadata.name)
}

function noWorkers() {
  return (
    <span>
      No workers have been assigned to this <strong>{application}</strong>. Once you configure a{" "}
      <strong>Compute {workerpool}</strong>, the workers will begin to process any queued-up Tasks.
    </span>
  )
}

function numWorkers(nPools: number, nWorkers: number) {
  return (
    <span>
      {nWorkers} <strong>{nWorkers === 1 ? "Worker" : "Workers"}</strong> spread across {nPools}{" "}
      <strong>Compute {nPools === 1 ? workerpool : workerpools}</strong> {nWorkers === 1 ? "has" : "have"} been assigned
      to this <strong>{application}</strong>.
    </span>
  )
}

const step: Step = {
  id: "Compute",
  variant: (props) => (associatedWorkerPools(props).length > 0 ? "success" : "warning"),
  content: (props, onClick) => {
    const queue = taskqueueProps(props)
    const pools = associatedWorkerPools(props)

    if (!queue) {
      return oopsNoQueue
    } else {
      const nPools = pools.length
      const nWorkers = pools.reduce((N, pool) => N + pool.spec.workers.count, 0)
      const body =
        pools.length === 0 ? (
          noWorkers()
        ) : (
          <Stack hasGutter>
            {numWorkers(nPools, nWorkers)}
            {linkToAllDetails("workerpools", pools, undefined, onClick)}
          </Stack>
        )
      const footer = <LinkToNewPool isInline taskqueue={queue.name} startOrAdd="create" onClick={onClick} />
      return { body, footer }
    }
  },
}

export default step
