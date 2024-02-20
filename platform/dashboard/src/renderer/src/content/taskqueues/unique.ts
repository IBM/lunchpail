import type ManagedEvents from "../ManagedEvent"
import type TaskQueueEvent from "@jaas/common/events/TaskQueueEvent"

export default function uniqueTaskQueues(props: Pick<ManagedEvents, "taskqueues">) {
  return Object.values(
    props.taskqueues.reduce(
      (M, taskqueue) => {
        M[taskqueue.metadata.name + "." + taskqueue.metadata.namespace + "." + taskqueue.metadata.context] = taskqueue
        return M
      },
      {} as Record<string, TaskQueueEvent>,
    ),
  )
}
