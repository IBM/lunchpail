import None from "../None"
import names from "../../names"
import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToAllTaskQueueDetails } from "../../navigate/details"

import type Props from "./Props"

import ApplicationIcon from "./Icon"

function api(props: Props) {
  return descriptionGroup(
    "api",
    props.application.spec.api,
    undefined,
    "The API used by this Application to distribute work.",
  )
}

export function taskqueues(props: Props) {
  const taskqueues = props.application.spec.inputs
    ? props.application.spec.inputs.flatMap((_) => Object.values(_.sizes))
    : undefined
  const taskqueueNames = !taskqueues
    ? []
    : taskqueues
        .filter(Boolean)
        .filter((taskqueueName) => !!props.taskqueues.find((taskqueue) => taskqueueName === taskqueue.metadata.name))

  return (
    taskqueueNames.length > 0 &&
    descriptionGroup(
      names.taskqueues,
      taskqueueNames.length === 0 ? None() : linkToAllTaskQueueDetails(taskqueueNames),
      taskqueueNames.length,
      "The Task Queues this application is capable of processing, i.e. those that it is compatible with.",
    )
  )
}

export function datasets(props: Props) {
  const datasets = props.application.spec.inputs
    ? props.application.spec.inputs.flatMap((_) => Object.values(_.sizes))
    : undefined
  const datasetNames = !datasets
    ? []
    : datasets
        .filter(Boolean)
        .filter((datasetName) => !!props.datasets.find((dataset) => datasetName === dataset.metadata.name))

  return (
    datasetNames.length > 0 &&
    descriptionGroup(
      names.datasets,
      datasetNames.length === 0 ? None() : linkToAllTaskQueueDetails(datasetNames),
      datasetNames.length,
      "The Datasets this application requires as input.",
    )
  )
}

function hasWorkerPool(props: Props) {
  return !!props.workerpools.find((_) => _.spec.application.name === props.application.metadata.name)
}

export default function ApplicationCard(props: Props) {
  const icon = <ApplicationIcon application={props.application} hasWorkerPool={hasWorkerPool(props)} />
  const name = props.application.metadata.name

  const groups = [
    api(props),
    props.application.spec.description && descriptionGroup("Description", props.application.spec.description),
    taskqueues(props),
    datasets(props),
  ]

  return <CardInGallery kind="applications" name={name} icon={icon} groups={groups} />
}
