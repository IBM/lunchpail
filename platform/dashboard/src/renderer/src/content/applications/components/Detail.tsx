import removeUndefined from "@jay/util/remove-undefined"
import DrawerContent from "@jay/components/Drawer/Content"

import taskqueueProps from "./taskqueueProps"

import codeTab from "./tabs/Code"
import yamlTab from "./tabs/Yaml"
import statusTab from "./tabs/Status"
import burndownTab from "./tabs/Burndown"

import editAction from "./actions/edit"
// import cloneAction from "./actions/clone"
import deleteAction from "./actions/delete"

import NewPoolButton from "../../taskqueues/components/NewPoolButton"
// import taskSimulatorAction from "../../taskqueues/components/TaskSimulatorAction"
import NewWorkDispatcherButton from "./actions/NewWorkDispatcher"

import type Props from "./Props"

/** Additional Tabs to show in the Detail view (beyond Summary and raw/Yaml) */
function otherTabs(props: Props) {
  return removeUndefined([codeTab(props), statusTab(props), burndownTab(props), yamlTab(props)])
}

export default function ApplicationDetail(props: Props) {
  const queueProps = taskqueueProps(props)
  const newPoolAction = !queueProps ? [] : [<NewPoolButton key="new-pool" {...queueProps} />]
  const newDispatcherAction = !queueProps
    ? []
    : [<NewWorkDispatcherButton key="new-dispatcher" {...props} queueProps={queueProps} />]

  return (
    <DrawerContent
      defaultActiveKey="Code"
      otherTabs={otherTabs(props)}
      actions={[...newDispatcherAction, ...newPoolAction]}
      rightActions={[editAction(props), /* cloneAction(props), */ deleteAction(props)]}
    />
  )
}
