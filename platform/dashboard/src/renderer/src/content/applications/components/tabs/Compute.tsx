import { DrawerPanelBody } from "@patternfly/react-core"

import DrawerTab from "@jay/components/Drawer/Tab"
import DetailNotFound from "@jay/components/DetailNotFound"

import type Props from "../Props"
import ComputeBody from "./ComputeBody"
import taskqueueProps from "../taskqueueProps"

import { groupSingular as application } from "@jay/resources/applications/group"
import { name as workerpools, singular as workerpool } from "@jay/resources/workerpools/name"

import NewPoolButton from "@jay/resources/taskqueues/components/NewPoolButton"

function NoWorkerPools(props: Props) {
  const queueProps = taskqueueProps(props)
  const action = !queueProps ? undefined : <NewPoolButton key="new-pool" {...queueProps} />
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
  const models = props.latestWorkerPoolModels.filter((_) => _.application === props.application.metadata.name)
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
