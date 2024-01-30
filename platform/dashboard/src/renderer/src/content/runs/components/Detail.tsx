import removeUndefined from "@jaas/util/remove-undefined"
import DrawerContent from "@jaas/components/Drawer/Content"

import codeTab from "@jaas/resources/applications/components/tabs/Code"
import dataTab from "@jaas/resources/applications/components/tabs/Data"
import workdispatchersTab from "@jaas/resources/applications/components/tabs/WorkDispatchers"
import computeTab from "@jaas/resources/applications/components/tabs/Compute"
//import burndownTab from "@jaas/resources/applications/components/tabs/Burndown"

import editAction from "@jaas/resources/applications/components/actions/edit"
// import cloneAction from "@jaas/resources/applications/components/actions/clone"
import deleteAction from "@jaas/resources/applications/components/actions/delete"

import type Props from "./Props"

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return removeUndefined([codeTab(props), dataTab(props), workdispatchersTab(props), computeTab(props)])
}

export default function ApplicationDetail(props: Props) {
  return (
    <DrawerContent
      defaultActiveKey="Code"
      raw={props.run}
      otherTabs={otherTabs(props)}
      rightActions={[editAction(props), /* cloneAction(props), */ deleteAction(props)]}
    />
  )
}
