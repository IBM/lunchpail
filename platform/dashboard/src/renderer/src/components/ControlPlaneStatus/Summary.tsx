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
  return status?.controlPlane && status?.runtime
}

export function isNeedingInit(status: null | ControlPlaneStatus) {
  // for now this is the opposite of isHealthy()... we need some
  // refinments to be able to distinguish healthy from not even there
  return !status?.controlPlane || !status?.runtime
}

function controlPlaneStatus(status: null | ControlPlaneStatus) {
  return (
    <span>
      <Link to={hash("jobmanager")}>Job Manager</Link> &mdash;{" "}
      {status === null
        ? "Not Provisioned"
        : isHealthy(status)
        ? "Healthy"
        : isNeedingInit(status)
        ? "Not ready"
        : "Unhealthy"}
    </span>
  )
}

export default function ControlPlaneStatusSummary() {
  const { status } = useContext(Status)
  const settings = useContext(Settings)

  return (
    <IconWithLabel icon={settings?.demoMode[0] ? undefined : isHealthy(status) ? <HealthyIcon /> : <UnhealthyIcon />}>
      {settings?.demoMode[0] ? demoModeStatus() : controlPlaneStatus(status)}
    </IconWithLabel>
  )
}
