import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import { name as runs } from "@jaas/resources/runs/name"

import type { PropsSummary as Props } from "./Props"

function associatedRuns(props: Props) {
  const { name, namespace, context } = props.taskqueue.metadata
  return props.runs.filter(
    (_) =>
      _.metadata.namespace === namespace &&
      _.metadata.context === context &&
      _.metadata.annotations["jaas.dev/taskqueue"] === name,
  )
}

export function associatedRunsGroup(props: Props) {
  return descriptionGroup(runs, linkToAllDetails("runs", associatedRuns(props)))
}
