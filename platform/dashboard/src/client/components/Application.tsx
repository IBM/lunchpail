import type ApplicationSpecEvent from "../events/ApplicationSpecEvent"

import ApplicationIcon from "@patternfly/react-icons//dist/esm/icons/code-icon"
export { ApplicationIcon }

type Props = ApplicationSpecEvent

import CardInGallery from "./CardInGallery"

export default class Application extends CardInGallery<Props> {
  protected override icon() {
    return <ApplicationIcon />
  }

  protected override label() {
    return this.props.application
  }

  protected override groups() {
    return [
      this.descriptionGroup("API", this.props.api),
      this.props.supportsGpu && this.descriptionGroup("Benefits from GPU", this.props.supportsGpu || false),
    ]
  }
}
