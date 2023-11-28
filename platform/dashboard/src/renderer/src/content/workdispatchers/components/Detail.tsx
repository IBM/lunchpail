import DrawerContent from "@jay/components/Drawer/Content"
import { dl, descriptionGroup } from "@jay/components/DescriptionGroup"

import { summaryGroups } from "./Card"
import { status, message } from "@jay/resources/workdispatchers/status"

//import editAction from "./actions/edit"
import deleteAction from "./actions/delete"

import type Props from "./Props"

function statusGroups(props: Props) {
  const { workdispatcher } = props
  return [
    descriptionGroup("status", status(workdispatcher)),
    ...(!message ? [] : [descriptionGroup("message", message(workdispatcher))]),
  ]
}

export default function WorkDispatcherDetail(props: Props) {
  return (
    <DrawerContent
      summary={dl({ groups: [...statusGroups(props), ...summaryGroups(props)] })}
      raw={props.workdispatcher}
      rightActions={[deleteAction(props)]}
    />
  )
}
