import { useMemo } from "react"
import { Label, LabelGroup } from "@patternfly/react-core"

import None from "@jaas/components/None"
import CardInGallery from "@jaas/components/CardInGallery"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import api from "@jaas/resources/applications/components/api"
import { taskqueue as associatedTaskQueue } from "@jaas/resources/runs/components/taskqueueProps"
import ProgressStepper from "@jaas/resources/runs/components/ProgressStepper"
import { done, unassigned } from "@jaas/resources/taskqueues/components/unassigned"

import { name as workerpoolsName } from "@jaas/resources/workerpools/name"

import type Props from "./Props"

/**
 * @return PatternFly `Card` actions for the given set of `Application`
 * tags
 */
function tags(tags: Props["application"]["spec"]["tags"]) {
  return !tags || tags.length === 0
    ? undefined
    : {
        hasNoOffset: true,
        actions: (
          <LabelGroup isCompact numLabels={2}>
            {tags.map((tag) => (
              <Label isCompact color="cyan" key={tag}>
                {tag}
              </Label>
            ))}
          </LabelGroup>
        ),
      }
}

/** @return set of WorkerPools assigned to this `Run` */
function associatedWorkerPools(
  props: Pick<Props, "run" | "workerpools" | "taskqueues">,
  queue = associatedTaskQueue(props),
) {
  return !queue
    ? []
    : props.workerpools.filter(
        ({ metadata, spec }) =>
          spec.run.name === props.run.metadata.name && metadata.context === queue.metadata.context,
      )
}

/** @return description group for `WorkerPools` associated with this `Run` */
function workerpoolsGroup(props: Pick<Props, "workerpools">) {
  return props.workerpools.length === 0
    ? undefined
    : descriptionGroup(
        `Active ${workerpoolsName}`,
        props.workerpools.length === 0 ? None() : linkToAllDetails("workerpools", props.workerpools),
        props.workerpools.length,
        "The Worker Pools that have been assigned to process tasks from this queue.",
      )
}

export default function RunCard(props: Props) {
  const taskqueue = associatedTaskQueue(props)
  const workerpools = associatedWorkerPools(props, taskqueue)

  // Card actions
  const actions = useMemo(() => tags(props.application.spec.tags), [props.application.spec.tags?.join(";")])

  // Card description groups
  const groups = useMemo(
    () => [
      ...api(props),
      props.application.spec.description && descriptionGroup("Description", props.application.spec.description),
      ...(!taskqueue ? [] : [unassigned({ taskqueue, run: props.run })]),
      ...(!taskqueue ? [] : [done({ taskqueue, run: props.run })]),
      ...(!taskqueue ? [] : [workerpoolsGroup({ workerpools })]),
    ],
    [props.run, props.application, JSON.stringify(taskqueue), JSON.stringify(workerpools)],
  )

  return (
    <CardInGallery
      kind="runs"
      name={props.run.metadata.name}
      context={props.run.metadata.context}
      groups={groups}
      actions={actions}
      footer={<ProgressStepper {...props} />}
    />
  )
}
