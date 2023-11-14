import type Props from "../Props"
import taskqueueProps from "../taskqueueProps"
import { unassignedChart } from "../../../taskqueues/components/Detail"
import { dl as DescriptionList } from "@jay/renderer/components/DescriptionGroup"

export default function burndownTab(props: Props) {
  const queueProps = taskqueueProps(props)
  const groups = !queueProps ? [] : unassignedChart(queueProps)

  return [
    {
      title: "Burndown",
      body:
        groups.length === 0 ? "Not enough data, yet, to show the burndown chart" : <DescriptionList groups={groups} />,
    },
  ]
}
