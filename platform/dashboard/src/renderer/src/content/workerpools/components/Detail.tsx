import DrawerContent from "@jay/components/Drawer/Content"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"

import { singular } from "../name"
import summaryTabContent from "./tabs/Summary"
import correctiveActions from "./corrective-actions"

import type Props from "./Props"

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      key="delete"
      singular={singular}
      kind="workerpool.codeflare.dev"
      name={props.model.label}
      namespace={props.model.namespace}
    />
  )
}

function rightActions(props: Props) {
  return [deleteAction(props)]
}

/** Common actions */
function leftActions(props: Props) {
  return [...correctiveActions(props)]
}

/** The body and actions to show in the WorkerPool Details view */
export default function WorkerPoolDetail(props: Props) {
  return (
    <DrawerContent
      summary={summaryTabContent(props)}
      raw={props?.status}
      actions={leftActions(props)}
      rightActions={rightActions(props)}
    />
  )
}
