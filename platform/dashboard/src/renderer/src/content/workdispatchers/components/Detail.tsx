import { useMemo } from "react"

import DrawerContent from "@jay/components/Drawer/Content"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { summaryGroups } from "./Card"
import { status } from "@jay/resources/workdispatchers/status"
import correctiveActions from "@jay/resources/workerpools/components/corrective-actions"
import { reasonAndMessageGroups } from "@jay/resources/workerpools/components/tabs/Summary"

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

  return [
    descriptionGroup("status", status(workdispatcher)),
    ...reasonAndMessageGroups(props.workdispatcher),
    ...configurationGroups(props),
  ]
}

export default function WorkDispatcherDetail(props: Props) {
  const {
    metadata: { name, namespace },
  } = props.workdispatcher
  const isOk = !/Fail/.test(status(props.workdispatcher))
  const otherTabs = useMemo(() => (!isOk ? [] : [LogsTab(name, namespace)]), [isOk, name, namespace])

  return (
    <DrawerContent
      summary={<DescriptionList groups={[...statusGroups(props), ...summaryGroups(props)]} />}
      raw={props.workdispatcher}
      otherTabs={otherTabs}
      actions={[...correctiveActions(props.workdispatcher)]}
      rightActions={[deleteAction(props)]}
    />
  )
}
