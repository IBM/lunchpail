import CardInGallery from "./CardInGallery"

import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

import ApplicationIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"
export { ApplicationIcon }

import rayImageUrl from "../images/ray.png"
import pytorchImageUrl from "../images/pytorch.svg"

export default class Application extends CardInGallery<ApplicationSpecEvent> {
  protected override kind() {
    return "Application"
  }

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
      this.props.supportsGpu && this.descriptionGroup("Benefits from GPU", this.props.supportsGpu || false),
    ]
  }

  protected detailGroups() {
    return Object.keys(this.props)
      .filter((_) => _ !== "application" && _ !== "timestamp" && _ !== "showDetails" && _ !== "currentSelection")
      .map((term) => this.descriptionGroup(term, this.props[term as keyof ApplicationSpecEvent]))
  }
}
