import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import type Props from "./Props"

import Icon from "./Icon"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function summaryGroups(_props: Props) {
  return [descriptionGroup("dispatch method", "Task Simulator")]
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
