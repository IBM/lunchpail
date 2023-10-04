import None from "../None"
import names from "../../names"
import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToAllDataSetDetails } from "../../navigate/details"

import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

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

export default class Application extends CardInGallery<ApplicationSpecEvent> {
  protected override kind() {
    return "applications" as const
  }

  protected override icon() {
    return <ApplicationIcon {...this.props} />
  }

  protected override label() {
    return this.props.application
  }

  protected override groups() {
    return [
      descriptionGroup("api", this.props.api, undefined, "The API used by this Application to distribute work."),
      datasets(this.props),
      this.props.description && descriptionGroup("Description", this.props.description),
      //this.props.supportsGpu && descriptionGroup("Benefits from GPU", this.props.supportsGpu),
    ]
  }
}
