import { Gallery } from "@patternfly/react-core"

import ControlPlaneStatus from "./ControlPlaneStatus/Card"

const width = { default: "35em" as const }

export default function Welcome() {
  return (
    <Gallery hasGutter minWidths={width} maxWidths={width}>
      <ControlPlaneStatus />
    </Gallery>
  )
}
