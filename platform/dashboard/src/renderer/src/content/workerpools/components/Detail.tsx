import { useMemo } from "react"
import DrawerContent from "@jaas/components/Drawer/Content"

import deleteAction from "./actions/delete"
import summaryTabContent from "./tabs/Summary"
import correctiveActions from "./corrective-actions"

import LogsTab from "./tabs/Logs"

import type Props from "./Props"

/** The body and actions to show in the WorkerPool Details view */
export default function WorkerPoolDetail(props: Props) {
  const { label: name, namespace, context } = props.model
  const nameProps = { name, namespace, context }

  const summary = useMemo(
    () => summaryTabContent(props.status, props.model.events, props.model.inbox, props.model.processing),
    [props.status, JSON.stringify(props.model.events), props.model.inbox, props.model.processing],
  )
  const otherTabs = useMemo(() => [LogsTab(nameProps)], [name, namespace, context])
  const leftActions = useMemo(() => [...(props.status ? correctiveActions(props.status) : [])], [props.status])
  const rightActions = useMemo(() => [deleteAction(nameProps)], [name, namespace, context])

  return (
    <DrawerContent
      summary={summary}
      raw={props?.status}
      otherTabs={otherTabs}
      actions={leftActions}
      rightActions={rightActions}
    />
  )
}
