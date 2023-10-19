import { Link } from "react-router-dom"

import Settings from "../../Settings"
import Status, { Status as ControlPlaneStatus } from "../../Status"

import { hash } from "../../navigate/kind"
import IconWithLabel from "../IconWithLabel"

import HealthyIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon"
import UnhealthyIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon"

function demoModeStatus() {
  return "Offline Demo"
}

function isHealthy(status: ControlPlaneStatus) {
  return status?.clusterExists && status?.core
}

function controlPlaneStatus(status: ControlPlaneStatus) {
  return (
    <Link to={hash("welcome")}>
      {status === null ? "Not Provisioned" : isHealthy(status) ? "Healthy" : "Unhealthy"}
    </Link>
  )
}

export default function ControlPlaneStatusSummary() {
  return (
    <Settings.Consumer>
      {(settings) => (
        <Status.Consumer>
          {(status) => (
            <IconWithLabel icon={isHealthy(status) ? <HealthyIcon /> : <UnhealthyIcon />}>
              {settings?.demoMode[0] ? demoModeStatus() : controlPlaneStatus(status)}
            </IconWithLabel>
          )}
        </Status.Consumer>
      )}
    </Settings.Consumer>
  )
}
