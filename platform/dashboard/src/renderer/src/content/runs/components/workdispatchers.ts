import None from "@jaas/components/None"
import type Props from "@jaas/resources/runs/components/Props"
import { linkToAllDetails } from "@jaas/renderer/navigate/details"
import { descriptionGroup } from "@jaas/components/DescriptionGroup"

import { name as workdispatchersName } from "@jaas/resources/workdispatchers/name"

/** @return the WorkDispatchers associated with `props.application` */
export default function workdispatchers(props: Props) {
  return props.workdispatchers.filter((_) => _.spec.run === props.run.metadata.name)
}

export function workdispatchersGroup(props: Props) {
  const associatedWorkDispatchers = workdispatchers(props)
  return descriptionGroup(
    workdispatchersName,
    associatedWorkDispatchers.length === 0 ? None() : linkToAllDetails("workdispatchers", associatedWorkDispatchers),
    associatedWorkDispatchers.length,
  )
}
