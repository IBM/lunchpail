import CardInGallery from "@jaas/components/CardInGallery"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import type Props from "./Props"

import Icon from "./Icon"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function summaryGroups(props: Props) {
  const { spec } = props.workdispatcher

  return [
    descriptionGroup("dispatch method", spec.method === "tasksimulator" ? "Task Simulator" : spec.method),
    descriptionGroup("run", linkToAllDetails("runs", [spec.run])),
  ]
}

export default function WorkDispatcherCard(props: Props) {
  const { name, context } = props.workdispatcher.metadata

  return (
    <CardInGallery kind="workdispatchers" name={name} context={context} icon={<Icon />} groups={summaryGroups(props)} />
  )
}
