import CardInGallery from "@jay/components/CardInGallery"
import { descriptionGroup } from "@jay/components/DescriptionGroup"

import taskqueueProps from "./taskqueueProps"
import { api, hasWorkerPool, datasetsGroup, workerpoolsGroup } from "./common"
import unassigned from "../../taskqueues/components/unassigned"

import type Props from "./Props"

import ApplicationIcon from "./Icon"

export default function ApplicationCard(props: Props) {
  const icon = <ApplicationIcon application={props.application} hasWorkerPool={hasWorkerPool(props)} />
  const name = props.application.metadata.name
  const queueProps = taskqueueProps(props)

  const groups = [
    ...api(props),
    props.application.spec.description && descriptionGroup("Description", props.application.spec.description),
    // taskqueuesGroup(props),
    datasetsGroup(props),
    ...(!queueProps ? [] : [workerpoolsGroup(props, queueProps.name)]),
    ...(!queueProps ? [] : [unassigned(queueProps)]),
  ]

  return <CardInGallery kind="applications" name={name} icon={icon} groups={groups} />
}
