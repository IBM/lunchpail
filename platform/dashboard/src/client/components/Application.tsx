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

  /**
   * If we can find a "foo.py", then append it to the repo, so that
   * users can click to see the source directly.
   */
  private get repoPlusSource() {
    const source = this.props["command"].match(/\s(\w+\.py)\s/)
    return this.props["repo"] + (source ? "/" + source[1] : "")
  }

  protected detailGroups() {
    return Object.entries(this.props)
      .filter(
        ([term]) =>
          term !== "application" && term !== "timestamp" && term !== "showDetails" && term !== "currentSelection",
      )
      .filter(([, value]) => value)
      .map(([term, value]) =>
        term === "repo"
          ? this.descriptionGroup(term, this.repoPlusSource)
          : typeof value !== "function" && this.descriptionGroup(term, value),
      )
  }
}
