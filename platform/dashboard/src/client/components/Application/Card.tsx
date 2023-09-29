import CardInGallery from "../CardInGallery"
import type ApplicationSpecEvent from "../../events/ApplicationSpecEvent"

import ApplicationIcon from "./Icon"

export default class Application extends CardInGallery<ApplicationSpecEvent> {
  protected override icon() {
    return <ApplicationIcon {...this.props} />
  }

  protected override label() {
    return this.props.application
  }

  protected override summaryGroups() {
    return [
      this.descriptionGroup("api", this.props.api),
      this.props["data sets"] && this.descriptionGroup("Data Sets", this.props["data sets"]),
      this.props.description && this.descriptionGroup("Description", this.props.description),
      //this.props.supportsGpu && this.descriptionGroup("Benefits from GPU", this.props.supportsGpu),
    ]
  }
}
