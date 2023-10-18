import { dl, descriptionGroup } from "../DescriptionGroup"

import { LinkToNewRepoSecret } from "../../navigate/newreposecret"
import { statusActions, summaryGroups, titleCaseSplit } from "./Summary"

import type Props from "./Props"
import type { LocationProps } from "../../router/withLocation"

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

/** Description list groups to show in the Details view for WorkerPools */
function detailGroups(props: Props) {
  return [statusGroup(props), ...reasonGroups(props), ...messageGroups(props), ...summaryGroups(props)]
}

/** Any suggestions/corrective action buttons */
function actions(props: Props, locationProps: LocationProps) {
  const latestStatus = props.statusHistory[props.statusHistory.length - 1]
  if (latestStatus?.status === "CloneFailed" && latestStatus?.reason === "AccessDenied") {
    const repoMatch = latestStatus?.message?.match(/(https:\/\/[^/]+)/)
    const repo = repoMatch ? repoMatch[1] : undefined
    return <LinkToNewRepoSecret repo={repo} namespace={props.model.namespace} {...locationProps} startOrAdd="fix" />
  } else {
    return
  }
}

/** The body and actions to show in the WorkerPool Details view */
export default function WorkerPoolDetail(props: Props | undefined, locationProps: LocationProps) {
  return { body: props && dl(detailGroups(props)), actions: props && actions(props, locationProps) }
}
