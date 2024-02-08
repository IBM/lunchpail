import { DrawerPanelBody } from "@patternfly/react-core"

import DrawerTab from "@jaas/components/Drawer/Tab"
import DetailNotFound from "@jaas/components/DetailNotFound"
import { LinkToNewPool } from "@jaas/renderer/navigate/newpool"

import type Props from "@jaas/resources/runs/components/Props"
import ComputeBody from "./ComputeBody"
import taskqueueProps from "../taskqueueProps"

import { groupSingular as application } from "@jaas/resources/applications/group"
import { name as workerpools, singular as workerpool } from "@jaas/resources/workerpools/name"

function NoWorkerPools(props: Props) {
  const queueProps = taskqueueProps(props)
  const action = !queueProps ? undefined : (
    <LinkToNewPool
      key="new-pool-button"
      run={props.run.metadata.name}
      namespace={props.run.metadata.namespace}
      startOrAdd="add"
    />
  )
  return (
    <DetailNotFound title="No Workers Assigned" action={action}>
      Consider creating a {workerpool} to begin processing Tasks
    </DetailNotFound>
  )
}

/** Tab that shows Compute details */
export default function computeTab(props: Props) {
  const queueProps = taskqueueProps(props)
  if (!queueProps) {
    return
  }

  // any associated workerpools?
  const models = props.latestWorkerPoolModels.filter((_) => _.run === props.run.metadata.name)
  const nWorkerPools = models.length

  // in case we want to show nWorkers rather than nWorkerPools as
  // count: const nWorkers = models.reduce((N, model) => N +
  // model.inbox.length, 0)

  // note: we need DrawerPanelBody because hasNoPadding: true, which
  // we do so that our secondary tabs can be flush to the primary tabs
  const body =
    nWorkerPools === 0 ? (
      <DrawerPanelBody>
        <NoWorkerPools {...props} />
      </DrawerPanelBody>
    ) : (
      <ComputeBody props={props} queueProps={queueProps} models={models} />
    )

  return DrawerTab({
    title: "Compute",
    hasNoPadding: true,
    count: nWorkerPools,
    body,
    tooltip: `This ${application} has ${nWorkerPools} assigned ${nWorkerPools === 1 ? workerpool : workerpools}`,
  })
}
