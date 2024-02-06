import type Props from "@jaas/resources/runs/components/Props"
import taskqueueProps from "../taskqueueProps"
import unassignedChart from "@jaas/resources/taskqueues/components/unassigned-chart"

import DrawerTab from "@jaas/components/Drawer/Tab"
import { dl as DescriptionList } from "@jaas/renderer/components/DescriptionGroup"

export default function burndownTab(props: Props) {
  const queueProps = taskqueueProps(props)
  const groups = !queueProps ? [] : unassignedChart(queueProps)

  return DrawerTab({
    title: "Burndown",
    body:
      groups.length === 0 ? "Not enough data, yet, to show the burndown chart" : <DescriptionList groups={groups} />,
  })
}
