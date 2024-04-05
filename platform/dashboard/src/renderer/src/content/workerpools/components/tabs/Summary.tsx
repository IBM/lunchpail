import Code from "@jaas/components/Code"
import type WorkerPoolStatusEvent from "@jaas/common/events/WorkerPoolStatusEvent"

import type Props from "../Props"
import { statusActions, summaryGroups, titleCaseSplit } from "../Summary"
import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"

function count(workerpool?: WorkerPoolStatusEvent) {
  return !workerpool ? 0 : workerpool.spec.workers.count
}

function statusGroup(workerpool?: WorkerPoolStatusEvent) {
  const nWorkers = count(workerpool)
  return statusActions(workerpool).actions.map((action) => [
    descriptionGroup(action.key, action, nWorkers + " worker" + (nWorkers === 1 ? "" : "s")),
  ])
}

export function reasonAndMessageGroups({ metadata }: import("@jaas/common/events/KubernetesResource").default) {
  const status = metadata.annotations["lunchpail.io/status"]
  const reason = metadata.annotations["lunchpail.io/reason"]
  const message = metadata.annotations["lunchpail.io/message"]

  const groups: import("react").ReactNode[] = []
  if (status !== "Running") {
    if (reason) {
      groups.push(descriptionGroup("Reason", titleCaseSplit(reason)))
    }
    if (message && message !== reason) {
      groups.push(
        descriptionGroup(
          "Message",
          !/\n/.test(message) ? (
            titleCaseSplit(message)
          ) : (
            <Code readOnly language="shell" maxHeight="400px">
              {message}
            </Code>
          ),
        ),
      )
    }
  }

  return groups
}

/** Description list groups to show in the Details view for WorkerPools */
function detailGroups(
  workerpool: undefined | WorkerPoolStatusEvent,
  events: Props["model"]["events"],
  inbox: number[],
  processing: number[],
  outbox: number[],
  statusOnly = false,
) {
  return [
    statusGroup(workerpool),
    ...(!workerpool ? [] : reasonAndMessageGroups(workerpool)),
    ...summaryGroups(workerpool, events, inbox, processing, outbox, statusOnly),
  ]
}

/** Content to display in the Summary tab */
export default function summaryTabContent(
  workerpool: undefined | WorkerPoolStatusEvent,
  events: Props["model"]["events"],
  inbox: number[],
  processing: number[],
  outbox: number[],
  statusOnly = false,
) {
  return <DescriptionList groups={detailGroups(workerpool, events, inbox, processing, outbox, statusOnly)} />
}
