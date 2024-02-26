import { useMemo } from "react"

import CardInGallery from "@jaas/components/CardInGallery"
import prettyPrintWorkerPoolName from "@jaas/resources/workerpools/components/pretty-print"

import type Props from "./Props"
import WorkerPoolIcon from "./Icon"
import { statusActions, summaryGroups } from "./Summary"

export default function WorkerPoolCard(props: Props) {
  const { label: name, context, events, inbox, processing, outbox } = props.model

  const icon = <WorkerPoolIcon />
  const groups = useMemo(
    () => summaryGroups(props.status, events, inbox, processing, outbox),
    [props.status, JSON.stringify(events), inbox, processing, outbox],
  )
  const actions = useMemo(() => statusActions(props.status, "small"), [props.status])

  const taskqueueName = props.model.inbox.length === 0 ? "" : Object.keys(props.model.inbox[0])[0]
  const title = prettyPrintWorkerPoolName(name, taskqueueName)

  return (
    <CardInGallery
      kind="workerpools"
      name={name}
      context={context}
      icon={icon}
      title={title}
      groups={groups}
      actions={actions}
    />
  )
}
