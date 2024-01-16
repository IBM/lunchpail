import { isHealthy } from "./HealthBadge"

import type Props from "./Props"

import HomeIcon from "@patternfly/react-icons/dist/esm/icons/laptop-house-icon"
import WorkersIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon"
import UnknownIcon from "@patternfly/react-icons/dist/esm/icons/square-icon"

export default function Icon(props: Props) {
  const isManager = !!props.spec.jaasManager
  const className = isHealthy(props)
    ? "codeflare--status-active"
    : isManager
      ? "codeflare--status-offline"
      : "codeflare--status-unknown"

  if (isManager) {
    return <HomeIcon className={className} />
  } else if (props.spec.isJaaSWorkerHost) {
    return <WorkersIcon className={className} />
  } else {
    return <UnknownIcon className={className} />
  }
}
