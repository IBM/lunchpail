import Sparkline from "../Sparkline"
import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import { dl, descriptionGroup } from "../DescriptionGroup"

import type Props from "./Props"
import { lastEvent, commonGroups } from "./common"

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
  return !last ? [] : [<DeleteButton kind="dataset" name={last.label} namespace={last.namespace} />]
}

/** Common actions */
function actions(props: Props) {
  return [...deleteAction(props)]
}

export default function DataSetDetail(props: Props | undefined) {
  return <DrawerContent body={props && dl(detailGroups(props))} actions={props && actions(props)} />
}
