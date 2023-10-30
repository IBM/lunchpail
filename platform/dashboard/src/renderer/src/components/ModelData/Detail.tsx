import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import { dl as DescriptionList, descriptionGroup } from "../DescriptionGroup"

import type Props from "./Props"

function detailGroups(props: Props) {
  return Object.entries(props.spec.local)
    .filter(([, value]) => value)
    .map(([term, value]) => typeof value !== "function" && typeof value !== "object" && descriptionGroup(term, value))
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteButton kind="dataset" uiKind="modeldatas" name={props.metadata.name} namespace={props.metadata.namespace} />
  )
}

/** Common actions */
function rightActions(props: Props) {
  return [deleteAction(props)]
}

function DataSetDetail(props: Props) {
  return (
    <DrawerContent
      summary={props && <DescriptionList groups={detailGroups(props)} />}
      raw={props}
      rightActions={props && rightActions(props)}
    />
  )
}

export default function MaybeDataSetDetail(props: Props | undefined) {
  return props && <DataSetDetail {...props} />
}
