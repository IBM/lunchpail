import { useContext } from "react"
import { Badge } from "@patternfly/react-core"

import Settings from "@jay/renderer/Settings"
import Status, { JobManagerStatus } from "@jay/renderer/Status"

function demoModeStatus() {
  return "Offline Demo"
}

export function isHealthy(status: null | JobManagerStatus) {
  return status?.cluster && status?.runtime
}

export function isNeedingInit(status: null | JobManagerStatus) {
  // for now this is the opposite of isHealthy()... we need some
  // refinments to be able to distinguish healthy from not even there
  return !status?.cluster || !status?.runtime
}

function jobManagerHealth(status: null | JobManagerStatus) {
  return status === null
    ? "Not Provisioned"
    : isHealthy(status)
    ? "Healthy"
    : isNeedingInit(status)
    ? "Not ready"
    : "Unhealthy"
}

export default function ControlPlaneHealthBadge() {
  const { status } = useContext(Status)
  const settings = useContext(Settings)

  return <Badge isRead>{settings?.demoMode[0] ? demoModeStatus() : jobManagerHealth(status)}</Badge>
}
