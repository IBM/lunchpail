import type Props from "./Props"
import None from "@jay/components/None"
import { linkToAllDetails } from "@jay/renderer/navigate/details"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import { name as workdispatchersName } from "@jay/resources/workdispatchers/name"

/** @return the WorkDispatchers associated with `props.application` */
export default function workdispatchers(props: Props) {
  return props.workdispatchers.filter((_) => _.spec.application === props.application.metadata.name)
}

export function workdispatchersGroup(props: Props) {
  const associatedWorkDispatchers = workdispatchers(props)
  return descriptionGroup(
    workdispatchersName,
    associatedWorkDispatchers.length === 0 ? None() : linkToAllDetails("workdispatchers", associatedWorkDispatchers),
    associatedWorkDispatchers.length,
  )
}
