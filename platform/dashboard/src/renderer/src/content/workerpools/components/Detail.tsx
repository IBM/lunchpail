import DrawerContent from "@jay/components/Drawer/Content"
import DeleteResourceButton from "@jay/components/DeleteResourceButton"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

import { singular } from "../name"
import { statusActions, summaryGroups, titleCaseSplit } from "./Summary"
import { LinkToNewRepoSecret, buttonPropsForNewRepoSecret } from "@jay/renderer/navigate/newreposecret"

import type Props from "./Props"

function statusGroup(props: Props) {
  return statusActions(props).actions.map((action) => [descriptionGroup(action.key, action)])
}

function reasonGroups(props: Props) {
  const latestStatus = props.status
  const status = latestStatus?.metadata.annotations["codeflare.dev/status"]
  const reason = latestStatus?.metadata.annotations["codeflare.dev/reason"]
  if (status !== "Running" && reason) {
    return [descriptionGroup("Reason", titleCaseSplit(reason))]
  } else {
    return []
  }
}

function messageGroups(props: Props) {
  const latestStatus = props.status
  const status = latestStatus?.metadata.annotations["codeflare.dev/status"]
  const message = latestStatus?.metadata.annotations["codeflare.dev/message"]
  if (status !== "Running" && message) {
    return [descriptionGroup("Message", titleCaseSplit(message))]
  } else {
    return []
  }
}

/** Description list groups to show in the Details view for WorkerPools */
function detailGroups(props: Props, statusOnly = false) {
  return [statusGroup(props), ...reasonGroups(props), ...messageGroups(props), ...summaryGroups(props, statusOnly)]
}

/** Any suggestions/corrective action buttons */
function correctiveActions(props: Props, startOrAdd: "fix" | "create" = "fix") {
  const latestStatus = props.status
  const status = latestStatus?.metadata.annotations["codeflare.dev/status"]
  const reason = latestStatus?.metadata.annotations["codeflare.dev/reason"]
  const message = latestStatus?.metadata.annotations["codeflare.dev/message"]
  if (status === "CloneFailed" && reason === "AccessDenied") {
    const repoMatch = message?.match(/(https:\/\/[^/]+)/)
    const repo = repoMatch ? repoMatch[1] : undefined
    return [
      <LinkToNewRepoSecret key="newreposecret" repo={repo} namespace={props.model.namespace} startOrAdd={startOrAdd} />,
    ]
  } else {
    return []
  }
}

/** Any suggestions/corrective action links */
export function correctiveLinks(
  location: Parameters<typeof buttonPropsForNewRepoSecret>[0],
  props: Props,
  startOrAdd: "fix" | "create" = "fix",
) {
  const latestStatus = props.status
  const status = latestStatus?.metadata.annotations["codeflare.dev/status"]
  const reason = latestStatus?.metadata.annotations["codeflare.dev/reason"]
  const message = latestStatus?.metadata.annotations["codeflare.dev/message"]
  if (status === "CloneFailed" && reason === "AccessDenied") {
    const repoMatch = message?.match(/(https:\/\/[^/]+)/)
    const repo = repoMatch ? repoMatch[1] : undefined
    return [buttonPropsForNewRepoSecret(location, { repo, namespace: props.model.namespace, startOrAdd })]
  } else {
    return []
  }
}

/** Delete this resource */
function deleteAction(props: Props) {
  return (
    <DeleteResourceButton
      key="delete"
      singular={singular}
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

/** Content to display in the Summary tab */
export function summaryTabContent(props: Props, statusOnly = false) {
  return <DescriptionList groups={detailGroups(props, statusOnly)} />
}

/** The body and actions to show in the WorkerPool Details view */
export default function WorkerPoolDetail(props: Props) {
  return (
    <DrawerContent
      summary={summaryTabContent(props)}
      raw={props?.status}
      actions={leftActions(props)}
      rightActions={rightActions(props)}
    />
  )
}
