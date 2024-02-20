import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

import CardInGallery from "@jaas/components/CardInGallery"
// import { descriptionGroup } from "@jaas/components/DescriptionGroup"

type Props = {
  taskqueue: TaskQueueEvent
}

export default function TaskQueueCard(props: Props) {
  const { name, context } = props.taskqueue.metadata

  return <CardInGallery kind="taskqueues" name={name} groups={[]} context={context} />
}
