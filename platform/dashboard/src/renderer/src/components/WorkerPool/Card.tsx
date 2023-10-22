import CardInGallery from "../CardInGallery"
import { statusActions, summaryGroups } from "./Summary"

import type Props from "./Props"
import type { BaseProps } from "../CardInGallery"

import WorkerPoolIcon from "./Icon"

export default function WorkerPoolCard(props: Props & BaseProps) {
  const kind = "workerpools" as const
  const label = props.model.label
  const icon = <WorkerPoolIcon />
  const groups = summaryGroups(props)
  const actions = statusActions(props, "small")

  return <CardInGallery {...props} kind={kind} label={label} icon={icon} groups={groups} actions={actions} />
}
