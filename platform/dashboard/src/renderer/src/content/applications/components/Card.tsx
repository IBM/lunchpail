import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import { api } from "./common"
import taskqueueProps from "./taskqueueProps"
import ProgressStepper from "./ProgressStepper"
import unassigned from "../../taskqueues/components/unassigned"

import type Props from "./Props"

function description(props: Props) {
  /* const [editing, setEditing] = useState(false)
  const editOn = useCallback(() => setEditing(true), [setEditing])
  const editOff = useCallback(() => setEditing(false), [setEditing])

  return <TextArea autoResize rows={30} onFocus={editOn} onBlur={editOff} readOnlyVariant={editing ? undefined : "plain"} onClick={stopPropagation} value={props.application.spec.description} />*/
  return props.application.spec.description
}

export default function ApplicationCard(props: Props) {
  const name = props.application.metadata.name
  const queueProps = taskqueueProps(props)

  const groups = [
    ...api(props),
    props.application.spec.description && descriptionGroup("Description", description(props)),
    ...(!queueProps ? [] : [unassigned(queueProps)]),
  ]

  return <CardInGallery kind="applications" name={name} groups={groups} footer={<ProgressStepper {...props} />} />
}
