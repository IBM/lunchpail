import { singular } from "../name"
import { BrowserTabs } from "@jay/components/S3Browser"
import DrawerContent from "@jay/components/Drawer/Content"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { lastEvent } from "./common"
import NewPoolButton from "./NewPoolButton"
import summaryTabContent from "./tabs/Summary"

import type Props from "./Props"
import type TaskQueueEvent from "@jay/common/events/TaskQueueEvent"

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

/** Left-aligned actions */
function leftActions(props: Props) {
  return [<NewPoolButton key="new-pool" {...props} />]
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
      actions={leftActions(props)}
      rightActions={rightActions(props)}
    />
  )
}
