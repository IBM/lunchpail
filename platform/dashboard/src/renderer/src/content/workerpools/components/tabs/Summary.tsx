import type Props from "../Props"
import { statusActions, summaryGroups, titleCaseSplit } from "../Summary"
import { dl as DescriptionList, descriptionGroup } from "@jay/components/DescriptionGroup"

function count(props: Props) {
  return !props.status ? 0 : props.status.spec.workers.count
}

function statusGroup(props: Props) {
  const nWorkers = count(props)
  return statusActions(props).actions.map((action) => [
    descriptionGroup(action.key, action, nWorkers + " worker" + (nWorkers === 1 ? "" : "s")),
  ])
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

/** Content to display in the Summary tab */
export default function summaryTabContent(props: Props, statusOnly = false) {
  return <DescriptionList groups={detailGroups(props, statusOnly)} />
}
