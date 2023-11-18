import DrawerContent from "@jay/components/Drawer/Content"
import { dl } from "@jay/components/DescriptionGroup"

import { summaryGroups } from "./Card"

//import editAction from "./actions/edit"
import deleteAction from "./actions/delete"

import type Props from "./Props"

export default function WorkDispatcherDetail(props: Props) {
  return (
    <DrawerContent
      summary={dl({ groups: summaryGroups(props) })}
      raw={props.workdispatcher}
      rightActions={[deleteAction(props)]}
    />
  )
}
