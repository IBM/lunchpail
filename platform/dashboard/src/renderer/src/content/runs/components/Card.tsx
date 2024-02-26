import { useMemo } from "react"
import { Label, LabelGroup } from "@patternfly/react-core"

import CardInGallery from "@jaas/components/CardInGallery"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import api from "@jaas/resources/applications/components/api"
import { taskqueue as associatedTaskQueue } from "@jaas/resources/runs/components/taskqueueProps"
import ProgressStepper from "@jaas/resources/runs/components/ProgressStepper"
import { done, unassigned } from "@jaas/resources/taskqueues/components/unassigned"

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

export default function RunCard(props: Props) {
  const taskqueue = associatedTaskQueue(props)

  // Card actions
  const actions = useMemo(() => tags(props.application.spec.tags), [props.application.spec.tags?.join(";")])

  // Card description groups
  const groups = useMemo(
    () => [
      ...api(props),
      props.application.spec.description && descriptionGroup("Description", props.application.spec.description),
      ...(!taskqueue ? [] : [unassigned({ taskqueue, run: props.run })]),
      ...(!taskqueue ? [] : [done({ taskqueue, run: props.run })]),
    ],
    [props.run, props.application, JSON.stringify(taskqueue)],
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
