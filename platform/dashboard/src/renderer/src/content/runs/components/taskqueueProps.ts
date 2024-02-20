import type Props from "@jaas/resources/runs/components/Props"

function taskqueues(props: Props) {
  const { namespace: runNamespace, annotations } = props.run.metadata
  const queueDataset = annotations["jaas.dev/taskqueue"]

  const queueEventIdx = !queueDataset
    ? -1
    : props.taskqueues.findLastIndex((_) => _.metadata.namespace === runNamespace && _.metadata.name === queueDataset)
  return queueEventIdx < 0 ? [] : [props.taskqueues[queueEventIdx].metadata.name]
}

/** This helps to use some of the TaskQueue views, given an Application Props */
export default function taskqueueProps(
  props: Props,
): undefined | import("@jaas/resources/taskqueues/components/Props").default {
  const queues = taskqueues(props)

  return queues.length === 0
    ? undefined
    : {
        name: queues[0],
        context: props.application.metadata.context,
        idx: props.taskqueueIndex[queues[0]],
        events: props.taskqueues.filter((_) => _.metadata.name === queues[0]),
        applications: [props.application],
        workerpools: props.workerpools.filter((_) => _.spec.run.name === props.run.metadata.name),
        workdispatchers: props.workdispatchers,
        settings: props.settings,
      }
}
