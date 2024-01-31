import { useMemo } from "react"

import removeUndefined from "@jaas/util/remove-undefined"
import DrawerContent from "@jaas/components/Drawer/Content"

import { datasets } from "@jaas/resources/applications/components/taskqueueProps"
import { datasetsGroup } from "@jaas/resources/applications/components/tabs/Data"

import workdispatchersTab from "@jaas/resources/applications/components/tabs/WorkDispatchers"
import computeTab from "@jaas/resources/applications/components/tabs/Compute"
//import burndownTab from "@jaas/resources/applications/components/tabs/Burndown"

import editAction from "@jaas/resources/applications/components/actions/edit"
// import cloneAction from "@jaas/resources/applications/components/actions/clone"
import deleteAction from "@jaas/resources/applications/components/actions/delete"

import { singular as Code } from "@jaas/resources/applications/name"
import { group as Compute } from "@jaas/resources/workerpools/group"
import { group as Dispatch } from "@jaas/resources/workdispatchers/group"
import { dl, descriptionGroup } from "@jaas/components/DescriptionGroup"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import type Props from "./Props"

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return removeUndefined([workdispatchersTab(props), computeTab(props)])
}

function computeGroup(props: Props) {
  const workerpools = props.workerpools.filter(
    (_) =>
      _.spec.application.name ===
      props.application.metadata.name /* && _.spec.application.namespace === props.application.metadata.namespace */,
  )
  return descriptionGroup(Compute, linkToAllDetails("workerpools", workerpools), workerpools.length)
}

function dispatchGroup(props: Props) {
  const dispatchers = props.workdispatchers.filter(
    (_) =>
      _.spec.application ===
      props.application.metadata.name /* && _.spec.application.namespace === props.application.metadata.namespace */,
  )
  return descriptionGroup(Dispatch, linkToAllDetails("workdispatchers", dispatchers), dispatchers.length)
}

export default function ApplicationDetail(props: Props) {
  const tabs = useMemo(() => otherTabs(props), [props])
  const summary = useMemo(
    () =>
      dl({
        groups: [
          descriptionGroup(Code, linkToAllDetails("applications", [props.application]), 1),
          datasetsGroup(datasets(props)),
          dispatchGroup(props),
          computeGroup(props),
        ],
      }),
    [props],
  )

  return (
    <DrawerContent
      summary={summary}
      raw={props.run}
      otherTabs={tabs}
      rightActions={[editAction(props), /* cloneAction(props), */ deleteAction(props)]}
    />
  )
}
