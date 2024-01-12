import { isHealthy } from "./HealthBadge"

import type Props from "./Props"

import HomeIcon from "@patternfly/react-icons/dist/esm/icons/laptop-house-icon"
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon"

export default function Icon(props: Props) {
  const isManager = !!props.spec.jaasManager
  const className = isHealthy(props) ? "codeflare--status-active" : isManager ? "codeflare--status-offline" : ""

  if (isManager) {
    return <HomeIcon className={className} />
  } else {
    return <ServerIcon className={className} />
  }
}
