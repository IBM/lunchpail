import Sparkline from "../Sparkline"
import DeleteButton from "../DeleteButton"
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
  if (last) {
    return <DeleteButton kind="dataset" name={last.label} namespace={last.namespace} />
  } else {
    return undefined
  }
}

/** Common actions */
function actions(props: Props) {
  return [deleteAction(props)].filter(Boolean)
}

export default function DataSetDetail(props: Props | undefined) {
  return { body: props && dl(detailGroups(props)), actions: props && actions(props) }
}
