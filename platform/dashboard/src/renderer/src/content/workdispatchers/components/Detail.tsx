import DrawerContent from "@jay/components/Drawer/Content"
import { dl, descriptionGroup } from "@jay/components/DescriptionGroup"

import { summaryGroups } from "./Card"
import { status, message } from "@jay/resources/workdispatchers/status"

//import editAction from "./actions/edit"
import deleteAction from "./actions/delete"

import LogsTab from "./tabs/Logs"

import type Props from "./Props"

function configurationGroups(props: Props) {
  const { spec } = props.workdispatcher

  if (spec.method === "tasksimulator") {
    if (typeof spec.rate === "object") {
      return [
        descriptionGroup("Interval between task injections", "every " + spec.rate.intervalSeconds + " seconds"),
        descriptionGroup("injected tasks per interval", spec.rate.tasks + " simulated task injected each time"),
      ]
    }
  } else if (spec.method === "parametersweep") {
    if (typeof spec.sweep === "object") {
      return [
        descriptionGroup("minimum value", spec.sweep.min),
        descriptionGroup("maximum value", spec.sweep.max),
        descriptionGroup("step", spec.sweep.step),
      ]
    }
  }

  return []
}

function statusGroups(props: Props) {
  const { workdispatcher } = props
  const msg = message(workdispatcher)

  return [
    descriptionGroup("status", status(workdispatcher)),
    ...(!msg ? [] : [descriptionGroup("message", msg)]),
    ...configurationGroups(props),
  ]
}

export default function WorkDispatcherDetail(props: Props) {
  return (
    <DrawerContent
      summary={dl({ groups: [...statusGroups(props), ...summaryGroups(props)] })}
      raw={props.workdispatcher}
      otherTabs={[LogsTab(props)]}
      rightActions={[deleteAction(props)]}
    />
  )
}
