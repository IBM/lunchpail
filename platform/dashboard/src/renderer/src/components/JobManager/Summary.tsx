import { useContext } from "react"
import { Link } from "react-router-dom"

import Settings from "../../Settings"
import Status, { JobManagerStatus } from "../../Status"

import { hash } from "../../navigate/kind"
import IconWithLabel from "../IconWithLabel"

import HealthyIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon"
import UnhealthyIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon"

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

export default function JobManagerhealthSummary() {
  const { status } = useContext(Status)
  const settings = useContext(Settings)

  return (
    <IconWithLabel icon={settings?.demoMode[0] ? undefined : isHealthy(status) ? <HealthyIcon /> : <UnhealthyIcon />}>
      {settings?.demoMode[0] ? demoModeStatus() : jobManagerHealth(status)}
    </IconWithLabel>
  )
}
