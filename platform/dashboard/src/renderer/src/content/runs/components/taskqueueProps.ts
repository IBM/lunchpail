import type Props from "@jaas/resources/runs/components/Props"

function taskqueue(props: Pick<Props, "run" | "taskqueues">) {
  const { namespace: runNamespace, annotations } = props.run.metadata
  const queueDataset = annotations["jaas.dev/taskqueue"]

  const queueEventIdx = !queueDataset
    ? -1
    : props.taskqueues.findLastIndex((_) => _.metadata.namespace === runNamespace && _.metadata.name === queueDataset)
  return queueEventIdx < 0 ? undefined : props.taskqueues[queueEventIdx]
}

/** This helps to use some of the TaskQueue views, given an Application Props */
export default function taskqueueProps(
  props: Props,
): undefined | import("@jaas/resources/taskqueues/components/Props").default {
  const queue = taskqueue(props)

  return !queue
    ? undefined
    : {
        run: props.run,
        name: queue.metadata.name,
        context: queue.metadata.context,
        events: props.taskqueues.filter(
          ({ metadata }) =>
            metadata.name === queue.metadata.name &&
            metadata.namespace === queue.metadata.namespace &&
            metadata.context === queue.metadata.context,
        ),
        workerpools: props.workerpools.filter(
          ({ metadata, spec }) =>
            spec.run.name === props.run.metadata.name && metadata.context === queue.metadata.context,
        ),
      }
}
