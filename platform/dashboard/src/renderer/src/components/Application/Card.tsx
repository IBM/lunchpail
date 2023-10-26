import None from "../None"
import names from "../../names"
import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToAllDataSetDetails } from "../../navigate/details"

import type { BaseProps } from "../CardInGallery"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import ApplicationIcon from "./Icon"

export function datasets(props: ApplicationSpecEvent) {
  const datasets = props.spec.inputs ? props.spec.inputs[0].sizes : undefined
  const datasetNames = !datasets ? [] : Object.values(datasets).filter(Boolean)

  return descriptionGroup(
    names["datasets"],
    datasetNames.length === 0 ? None() : linkToAllDataSetDetails(datasetNames),
    undefined,
    "The Task Queues this application is capable of processing, i.e. those that it is compatible with.",
  )
}

export default function ApplicationCard(props: BaseProps & ApplicationSpecEvent) {
  const kind = "applications" as const
  const icon = <ApplicationIcon {...props} />
  const label = props.metadata.name
  const groups = [
    descriptionGroup("api", props.spec.api, undefined, "The API used by this Application to distribute work."),
    datasets(props),
    props.spec.description && descriptionGroup("Description", props.spec.description),
    //props.supportsGpu && descriptionGroup("Benefits from GPU", props.supportsGpu),
  ]

  return <CardInGallery {...props} kind={kind} label={label} icon={icon} groups={groups} />
}
