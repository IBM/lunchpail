import Sparkline from "../Sparkline"
import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import { dl, descriptionGroup } from "../DescriptionGroup"
import { NewPoolButton, lastEvent, commonGroups } from "./common"

import type Props from "./Props"
import type { LocationProps } from "../../router/withLocation"

function bucket(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Bucket", last ? last.bucket : "unknown")
}

function storageType(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Storage Type", last ? last.storageType : "unknown")
}

function inboxHistory(props: Props) {
  return props.events.map((_) => _.inbox)
}

function unassignedChart(props: Props) {
  const history = inboxHistory(props)

  return descriptionGroup(
    "Tasks over Time",
    history.length === 0 ? <></> : <Sparkline data={history} datasetIdx={props.idx} />,
  )
}

function detailGroups(props: Props) {
  return [
    storageType(props),
    bucket(props),
    ...commonGroups(props),
    unassignedChart(props),
    // completionRateChart(),
  ]
}

/** Delete this resource */
function deleteAction(props: Props) {
  const last = lastEvent(props)
  return !last ? [] : [<DeleteButton key="delete" kind="dataset" name={last.label} namespace={last.namespace} />]
}

/** Common actions */
function actions(props: Props & Pick<LocationProps, "location" | "searchParams">) {
  return [<NewPoolButton key="new-pool" {...props} />, ...deleteAction(props)]
}

export default function DataSetDetail(props: (Props & Pick<LocationProps, "location" | "searchParams">) | undefined) {
  return <DrawerContent body={props && dl(detailGroups(props))} actions={props && actions(props)} />
}
