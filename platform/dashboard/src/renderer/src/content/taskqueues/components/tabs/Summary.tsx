import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"

import unassigned from "../unassigned"
import { associatedRunsGroup } from "../associated"
import type { PropsSummary as Props } from "../Props"
// import { workerpools } from "../common"

function bucket(props: Props) {
  const last = props.taskqueue
  return descriptionGroup("Bucket", last ? last.spec.local.bucket : "unknown")
}

export function detailGroups(props: Props) {
  return [
    unassigned(props),
    bucket(props),
    associatedRunsGroup(props),
    // ...unassignedChart(props),
    // ...(tasksOnly ? [] : [workerpools(props), bucket(props)]),
    // completionRateChart(),
  ]
}

/** Summary tab content */
export default function summaryTabContent(props: Props) {
  return <DescriptionList groups={[...detailGroups(props)]} ouiaId={props.taskqueue.metadata.name} />
}
