import type Props from "./Props"
import { dl, descriptionGroup } from "../DescriptionGroup"

import { statusActions, summaryGroups, titleCaseSplit } from "./Summary"

function statusGroup(props: Props) {
  return statusActions(props).actions.map((action) => [descriptionGroup(action.key, action)])
}

function reasonGroups(props: Props) {
  const latestStatus = props.statusHistory[props.statusHistory.length - 1]
  if (latestStatus?.reason) {
    return [descriptionGroup("Reason", titleCaseSplit(latestStatus.reason))]
  } else {
    return []
  }
}

function messageGroups(props: Props) {
  const latestStatus = props.statusHistory[props.statusHistory.length - 1]
  if (latestStatus?.message) {
    return [descriptionGroup("Message", titleCaseSplit(latestStatus.message))]
  } else {
    return []
  }
}

function detailGroups(props: Props) {
  return [statusGroup(props), ...reasonGroups(props), ...messageGroups(props), ...summaryGroups(props)]
}

export default function WorkerPoolDetail(props: Props | undefined) {
  return props && dl(detailGroups(props))
}
