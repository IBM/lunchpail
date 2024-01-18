import CardInGallery from "@jay/components/CardInGallery"
import { statusActions, summaryGroups } from "./Summary"

import prettyPrintWorkerPoolName from "@jay/resources/workerpools/components/pretty-print"

import type Props from "./Props"

import WorkerPoolIcon from "./Icon"

export default function WorkerPoolCard(props: Props) {
  const name = props.model.label
  const context = props.model.context
  const icon = <WorkerPoolIcon />
  const groups = summaryGroups(props)
  const actions = statusActions(props, "small")

  const taskqueueName = props.model.inbox.length === 0 ? "" : Object.keys(props.model.inbox[0])[0]
  const title = prettyPrintWorkerPoolName(name, taskqueueName)

  return (
    <CardInGallery
      kind="workerpools"
      name={name}
      context={context}
      icon={icon}
      groups={groups}
      actions={actions}
      title={title}
    />
  )
}
