import type { ReactNode } from "react"

import type Props from "../Props"
import unassigned from "../unassigned"
import { lastEvent, workerpools } from "../common"
import { dl as DescriptionList, descriptionGroup } from "@jaas/components/DescriptionGroup"

function bucket(props: Props) {
  const last = lastEvent(props)
  return descriptionGroup("Bucket", last ? last.spec.local.bucket : "unknown")
}

function detailGroups(props: Props, tasksOnly = false) {
  return [
    unassigned(props),
    // ...unassignedChart(props),
    ...(tasksOnly ? [] : [workerpools(props), bucket(props)]),
    // completionRateChart(),
  ]
}

/** Summary tab content */
export default function summaryTabContent(props: Props, tasksOnly = false, extraGroups: ReactNode[] = []) {
  return <DescriptionList groups={[...extraGroups, ...detailGroups(props, tasksOnly)]} ouiaId={props.name} />
}
