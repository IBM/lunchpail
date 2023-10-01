import { Flex } from "@patternfly/react-core"

import CardInGallery from "../CardInGallery"
import { descriptionGroup } from "../DescriptionGroup"
import { linkToDataSetDetails } from "../../navigate/details"

import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

import ApplicationIcon from "./Icon"

export function datasets(props: ApplicationSpecEvent) {
  return (
    props["data sets"] &&
    descriptionGroup("Data Sets", <Flex>{Object.values(props["data sets"]).map(linkToDataSetDetails)}</Flex>)
  )
}

export default class Application extends CardInGallery<ApplicationSpecEvent> {
  protected override kind() {
    return "Application"
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
