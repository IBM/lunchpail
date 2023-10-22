import None from "../None"
import names from "../../names"
import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToAllDataSetDetails } from "../../navigate/details"

import type { BaseProps } from "../CardInGallery"
import type ApplicationSpecEvent from "@jay/common/events/ApplicationSpecEvent"

import ApplicationIcon from "./Icon"

export function datasets(props: ApplicationSpecEvent) {
  const datasets = props["data sets"]
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
  const label = props.application
  const groups = [
    descriptionGroup("api", props.api, undefined, "The API used by this Application to distribute work."),
    datasets(props),
    props.description && descriptionGroup("Description", props.description),
    //props.supportsGpu && descriptionGroup("Benefits from GPU", props.supportsGpu),
  ]

  return <CardInGallery {...props} kind={kind} label={label} icon={icon} groups={groups} />
}
