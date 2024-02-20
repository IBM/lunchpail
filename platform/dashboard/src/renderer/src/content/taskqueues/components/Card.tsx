import CardInGallery from "@jaas/components/CardInGallery"
// import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import type { PropsSummary as Props } from "./Props"
import { detailGroups } from "./tabs/Summary"

export default function TaskQueueCard(props: Props) {
  const { name, context } = props.taskqueue.metadata

  return <CardInGallery kind="taskqueues" name={name} groups={detailGroups(props)} context={context} />
}
