import removeUndefined from "@jaas/util/remove-undefined"
import DrawerContent from "@jaas/components/Drawer/Content"

import codeTab from "./tabs/Code"
import dataTab from "./tabs/Data"

import editAction from "./actions/edit"
// import cloneAction from "./actions/clone"
import deleteAction from "./actions/delete"

import type Props from "./Props"

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return removeUndefined([codeTab(props), dataTab(props)])
}

export default function ApplicationDetail(props: Props) {
  return (
    <DrawerContent
      defaultActiveKey="Code"
      raw={props.application}
      otherTabs={otherTabs(props)}
      rightActions={[editAction(props), /* cloneAction(props), */ deleteAction(props)]}
    />
  )
}
