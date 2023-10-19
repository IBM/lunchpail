import { useContext } from "react"
import { Link } from "react-router-dom"

import Settings from "../../Settings"
import Status, { ControlPlaneStatus } from "../../Status"

import { hash } from "../../navigate/kind"
import IconWithLabel from "../IconWithLabel"

import HealthyIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon"
import UnhealthyIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon"

function demoModeStatus() {
  return "Offline Demo"
}

export function isHealthy(status: null | ControlPlaneStatus) {
  return status?.management && status?.runtime
}

function controlPlaneStatus(status: null | ControlPlaneStatus) {
  return (
    <Link to={hash("welcome")}>
      {status === null ? "Not Provisioned" : isHealthy(status) ? "Healthy" : "Unhealthy"}
    </Link>
  )
}

export default function ControlPlaneStatusSummary() {
  const { status } = useContext(Status)
  const settings = useContext(Settings)

  return (
    <IconWithLabel icon={isHealthy(status) ? <HealthyIcon /> : <UnhealthyIcon />}>
      {settings?.demoMode[0] ? demoModeStatus() : controlPlaneStatus(status)}
    </IconWithLabel>
  )
}
