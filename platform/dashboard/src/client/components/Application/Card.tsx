import names from "../../names"
import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToAllDataSetDetails } from "../../navigate/details"

import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

import ApplicationIcon from "./Icon"

export function datasets(props: ApplicationSpecEvent) {
  return (
    props["data sets"] &&
    descriptionGroup(names["datasets"], linkToAllDataSetDetails(Object.values(props["data sets"])))
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
      this.descriptionGroup("api", this.props.api),
      datasets(this.props),
      this.props.description && this.descriptionGroup("Description", this.props.description),
      //this.props.supportsGpu && this.descriptionGroup("Benefits from GPU", this.props.supportsGpu),
    ]
  }
}
