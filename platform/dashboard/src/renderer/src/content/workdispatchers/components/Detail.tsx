import DrawerContent from "@jay/components/Drawer/Content"
import { dl, descriptionGroup } from "@jay/components/DescriptionGroup"

import { summaryGroups } from "./Card"

//import editAction from "./actions/edit"
import deleteAction from "./actions/delete"

import type Props from "./Props"

function statusGroups(props: Props) {
  const { annotations } = props.workdispatcher.metadata
  const status = annotations["codeflare.dev/status"] || "Unknown"
  const message = annotations["codeflare.dev/message"]

  return [descriptionGroup("status", status), ...(!message ? [] : [descriptionGroup("message", message)])]
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
