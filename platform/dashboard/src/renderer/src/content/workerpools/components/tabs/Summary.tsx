import type Props from "../Props"
import { statusActions, summaryGroups, titleCaseSplit } from "../Summary"
import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"

function count(props: Props) {
  return !props.status ? 0 : props.status.spec.workers.count
}

function statusGroup(props: Props) {
  const nWorkers = count(props)
  return statusActions(props).actions.map((action) => [
    descriptionGroup(action.key, action, nWorkers + " worker" + (nWorkers === 1 ? "" : "s")),
  ])
}

export function reasonAndMessageGroups({ metadata }: import("@jaas/common/events/KubernetesResource").default) {
  const status = metadata.annotations["codeflare.dev/status"]
  const reason = metadata.annotations["codeflare.dev/reason"]
  const message = metadata.annotations["codeflare.dev/message"]

  const groups: import("react").ReactNode[] = []
  if (status !== "Running") {
    if (reason) {
      groups.push(descriptionGroup("Reason", titleCaseSplit(reason)))
    }
    if (message) {
      groups.push(descriptionGroup("Message", titleCaseSplit(message)))
    }
  }

  return groups
}

/** Description list groups to show in the Details view for WorkerPools */
function detailGroups(props: Props, statusOnly = false) {
  return [
    statusGroup(props),
    ...(!props.status ? [] : reasonAndMessageGroups(props.status)),
    ...summaryGroups(props, statusOnly),
  ]
}

/** Content to display in the Summary tab */
export default function summaryTabContent(props: Props, statusOnly = false) {
  return <DescriptionList groups={detailGroups(props, statusOnly)} />
}
