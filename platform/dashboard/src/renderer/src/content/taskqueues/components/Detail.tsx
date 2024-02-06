import { singular } from "../name"
import { BrowserTabs } from "@jaas/components/S3Browser"
import DrawerContent from "@jaas/components/Drawer/Content"
import DeleteResourceButton from "@jaas/components/DeleteResourceButton"
import { lastEvent } from "./common"
import summaryTabContent from "./tabs/Summary"

import type Props from "./Props"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

/** Delete this taskqueue */
function deleteAction(last: null | TaskQueueEvent) {
  return !last
    ? []
    : [
        <DeleteResourceButton
          key="delete"
          kind="dataset"
          singular={singular}
          name={last.metadata.name}
          namespace={last.metadata.namespace}
          context={last.metadata.context}
        />,
      ]
}

/** Right-aligned actions */
function rightActions(props: Props) {
  const last = lastEvent(props)
  return [...deleteAction(last)]
}

/** Tabs specific to this kind of data */
function otherTabs(props: Props) {
  const last = lastEvent(props)
  const tab = !last ? undefined : BrowserTabs(last.spec.local)
  return tab ? [tab] : undefined
}

export default function TaskQueueDetail(props: Props) {
  return (
    <DrawerContent
      summary={summaryTabContent(props)}
      raw={lastEvent(props)}
      otherTabs={otherTabs(props)}
      rightActions={rightActions(props)}
    />
  )
}
