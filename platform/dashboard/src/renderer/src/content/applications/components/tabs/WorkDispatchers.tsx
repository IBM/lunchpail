import DrawerTab from "@jay/components/Drawer/Tab"
import { dl } from "@jay/components/DescriptionGroup"

import DetailNotFound from "@jay/components/DetailNotFound"

import { singular as workdispatcher } from "@jay/resources/workdispatchers/name"
import unassigned, { nUnassigned } from "@jay/resources/taskqueues/components/unassigned"

import type Props from "../Props"
import taskqueueProps from "../taskqueueProps"
import NewWorkDispatcherButton from "../actions/NewWorkDispatcher"
import workdispatchers, { workdispatchersGroup } from "../workdispatchers"

function NoWorkDispatchers(props: Props) {
  const queueProps = taskqueueProps(props)
  const action = !queueProps ? undefined : (
    <NewWorkDispatcherButton key="new-dispatcher" {...props} queueProps={queueProps} />
  )
  return (
    <DetailNotFound title="No Dispatchers Assigned" action={action}>
      Consider creating a {workdispatcher} to populate the queue of Tasks to process
    </DetailNotFound>
  )
}

export default function DataTab(props: Props) {
  const queueProps = taskqueueProps(props)
  const nDispatchers = workdispatchers(props).length
  const unassignedGroup = !queueProps || nUnassigned(queueProps) === 0 ? [] : [unassigned(queueProps)]
  const activeDispatchersGroup = nDispatchers === 0 ? [] : [workdispatchersGroup(props)]

  const body = (
    <>
      {dl({ groups: [...activeDispatchersGroup, ...unassignedGroup], ouiaId: queueProps?.name })}
      {nDispatchers === 0 && <NoWorkDispatchers {...props} />}
    </>
  )

  return DrawerTab({
    title: "Tasks",
    body,
    count: nDispatchers,
  })
}
