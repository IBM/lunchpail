import CardInGallery from "./CardInGallery"

import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

import ApplicationIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"
export { ApplicationIcon }

import rayImageUrl from "../images/ray.png"
import pytorchImageUrl from "../images/pytorch.svg"

export default class Application extends CardInGallery<ApplicationSpecEvent> {
  protected override icon() {
    switch (this.props.api) {
      case "ray":
        return <img src={rayImageUrl} />
      case "torch":
        return <img src={pytorchImageUrl} />
      default:
        return <ApplicationIcon />
    }
  }

  protected override label() {
    return this.props.application
  }

  protected override summaryGroups() {
    return [
      this.descriptionGroup("api", this.props.api),
      this.props.description && this.descriptionGroup("Description", this.props.description),
      //this.props.supportsGpu && this.descriptionGroup("Benefits from GPU", this.props.supportsGpu),
    ]
  }

  protected detailGroups() {
    return Object.entries(this.props)
      .filter(
        ([term]) =>
          term !== "application" && term !== "timestamp" && term !== "showDetails" && term !== "currentSelection",
      )
      .filter(([, value]) => value)
      .map(([term, value]) => typeof value !== "function" && this.descriptionGroup(term, value))
  }
}
