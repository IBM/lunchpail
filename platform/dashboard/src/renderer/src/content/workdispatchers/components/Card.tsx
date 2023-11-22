import CardInGallery from "@jay/components/CardInGallery"
import { linkToAllDetails } from "@jay/renderer/navigate/details"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import type Props from "./Props"

import Icon from "./Icon"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function summaryGroups(props: Props) {
  const { spec } = props.workdispatcher

  return [
    descriptionGroup("dispatch method", spec.method === "tasksimulator" ? "Task Simulator" : spec.method),
    descriptionGroup("application", linkToAllDetails("applications", [spec.application])),
  ]
}

export default function WorkDispatcherCard(props: Props) {
  return (
    <CardInGallery
      kind="workdispatchers"
      name={props.workdispatcher.metadata.name}
      icon={<Icon />}
      groups={summaryGroups(props)}
    />
  )
}
