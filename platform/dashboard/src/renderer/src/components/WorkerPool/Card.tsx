import CardInGallery from "../CardInGallery"
import { statusActions, summaryGroups } from "./Summary"

import type Props from "./Props"

import WorkerPoolIcon from "./Icon"

export default function WorkerPoolCard(props: Props) {
  const name = props.model.label
  const icon = <WorkerPoolIcon />
  const groups = summaryGroups(props)
  const actions = statusActions(props, "small")

  return <CardInGallery kind="workerpools" name={name} icon={icon} groups={groups} actions={actions} />
}
