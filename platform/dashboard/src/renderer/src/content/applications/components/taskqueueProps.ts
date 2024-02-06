import type Props from "./Props"

function inputs(props: Pick<Props, "application">) {
  return props.application.spec.inputs
    ? props.application.spec.inputs.flatMap((_) => Object.values(_.sizes)).filter(Boolean)
    : []
}

//type RunProps = Pick<Props, 'taskqueues' | 'settings' | 'workdispatchers' | 'workerpools'> & { run : import('@jaas/common/events/RunEvent').default }
import type RunProps from "@jaas/resources/runs/components/Props"

function taskqueues(props: RunProps) {
  const { name: runName, namespace: runNamespace } = props.run.metadata

  const queueEventIdx = props.taskqueues.findLastIndex(
    (_) => _.metadata.namespace === runNamespace && _.metadata.labels["app.kubernetes.io/part-of"] === runName,
  )
  return queueEventIdx < 0 ? [] : [props.taskqueues[queueEventIdx].metadata.name]
}

export function datasets(props: Pick<Props, "application" | "datasets">) {
  return inputs(props).filter(
    (datasetName) => !!props.datasets.find((dataset) => datasetName === dataset.metadata.name),
  )
}

/** This helps to use some of the TaskQueue views, given an Application Props */
export default function taskqueueProps(
  props: RunProps,
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
        workerpools: props.workerpools.filter((_) => _.spec.application.name === props.application.metadata.name),
        workdispatchers: props.workdispatchers,
        settings: props.settings,
      }
}
