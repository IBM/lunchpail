import None from "@jaas/components/None"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"

import { name as workerpoolsName } from "@jaas/resources/workerpools/name"
// import { name as applicationsName } from "@jaas/resources/applications/name"

import type Props from "./Props"

export function workerpools(props: Props) {
  return props.workerpools.length === 0
    ? undefined
    : descriptionGroup(
        `Active ${workerpoolsName}`,
        props.workerpools.length === 0 ? None() : linkToAllDetails("workerpools", props.workerpools),
        props.workerpools.length,
        "The Worker Pools that have been assigned to process tasks from this queue.",
      )
}

export function numAssociatedWorkerPools(props: Props) {
  return props.workerpools.length
}
