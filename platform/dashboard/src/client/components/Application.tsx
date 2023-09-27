import CardInGallery from "./CardInGallery"

import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

import WorkQueueIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon"
import ApplicationIcon from "@patternfly/react-icons/dist/esm/icons/code-icon"

import rayImageUrl from "../images/ray.png"
import sparkImageUrl from "../images/spark.svg"
import pytorchImageUrl from "../images/pytorch.svg"

export function applicationIcon(props: ApplicationSpecEvent) {
  switch (props.api) {
    case "ray":
      return <img className="codeflare--card-icon-image" src={rayImageUrl} />
    case "torch":
      return <img className="codeflare--card-icon-image" src={pytorchImageUrl} />
    case "spark":
      return <img className="codeflare--card-icon-image" src={sparkImageUrl} />
    case "workqueue":
      return <WorkQueueIcon />
    default:
      return <ApplicationIcon />
  }
}

export default class Application extends CardInGallery<ApplicationSpecEvent> {
  protected override icon() {
    return applicationIcon(this.props)
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
