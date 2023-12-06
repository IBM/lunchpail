import removeUndefined from "@jay/util/remove-undefined"
import DrawerContent from "@jay/components/Drawer/Content"

import codeTab from "./tabs/Code"
import dataTab from "./tabs/Data"
import workdispatchersTab from "./tabs/WorkDispatchers"
import yamlTab from "./tabs/Yaml"
import computeTab from "./tabs/Compute"
//import burndownTab from "./tabs/Burndown"

import editAction from "./actions/edit"
// import cloneAction from "./actions/clone"
import deleteAction from "./actions/delete"

import type Props from "./Props"

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return removeUndefined([codeTab(props), dataTab(props), workdispatchersTab(props), computeTab(props), yamlTab(props)])
}

export default function ApplicationDetail(props: Props) {
  return (
    <DrawerContent
      defaultActiveKey="Code"
      otherTabs={otherTabs(props)}
      rightActions={[editAction(props), /* cloneAction(props), */ deleteAction(props)]}
    />
  )
}
