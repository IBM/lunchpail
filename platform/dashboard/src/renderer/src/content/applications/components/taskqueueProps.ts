import type Props from "./Props"

function inputs(props: Props) {
  return props.application.spec.inputs
    ? props.application.spec.inputs.flatMap((_) => Object.values(_.sizes)).filter(Boolean)
    : []
}

function taskqueues(props: Props) {
  return inputs(props).filter(
    (taskqueueName) => !!props.taskqueues.find((taskqueue) => taskqueueName === taskqueue.metadata.name),
  )
}

export function datasets(props: Props) {
  return inputs(props).filter(
    (datasetName) => !!props.datasets.find((dataset) => datasetName === dataset.metadata.name),
  )
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
        workerpools: props.workerpools.filter((_) => _.spec.application.name === props.application.metadata.name),
        workdispatchers: props.workdispatchers,
        settings: props.settings,
      }
}
