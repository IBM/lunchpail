import DeleteButton from "../DeleteButton"
import DrawerContent from "../Drawer/Content"
import { dl, descriptionGroup } from "../DescriptionGroup"

import { LinkToNewRepoSecret } from "../../navigate/newreposecret"
import { statusActions, summaryGroups, titleCaseSplit } from "./Summary"

import type Props from "./Props"

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
function correctiveActions(props: Props) {
  const latestStatus = props.statusHistory[props.statusHistory.length - 1]
  if (latestStatus?.status === "CloneFailed" && latestStatus?.reason === "AccessDenied") {
    const repoMatch = latestStatus?.message?.match(/(https:\/\/[^/]+)/)
    const repo = repoMatch ? repoMatch[1] : undefined
    return [<LinkToNewRepoSecret repo={repo} namespace={props.model.namespace} startOrAdd="fix" />]
  } else {
    return []
  }
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteButton
      key="delete"
      kind="workerpool.codeflare.dev"
      name={props.model.label}
      namespace={props.model.namespace}
    />
  )
}

function rightActions(props: Props) {
  return [deleteAction(props)]
}

/** Common actions */
function leftActions(props: Props) {
  return [...correctiveActions(props)]
}

/** The body and actions to show in the WorkerPool Details view */
export default function WorkerPoolDetail(props: Props | undefined) {
  return (
    <DrawerContent
      body={props && dl(detailGroups(props))}
      actions={props && leftActions(props)}
      rightActions={props && rightActions(props)}
    />
  )
}
