import { Link } from "react-router-dom"

import Settings from "../Settings"
import Status, { Status as ControlPlaneStatus } from "../Status"

import { hash } from "../navigate/kind"
import IconWithLabel from "./IconWithLabel"
import { dl, descriptionGroup } from "./DescriptionGroup"

import "./ControlPlaneStatus.scss"

import HealthyIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon"
import UnhealthyIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon"

export function ControlPlaneStatusDetail() {
  return (
    <Settings.Consumer>
      {(settings) => {
        if (!settings?.demoMode[0]) {
          return (
            <Status.Consumer>
              {(status) => {
                if (!status) {
                  return "Checking on the status of the control plane..."
                } else {
                  return dl(Object.entries(status).map(([key, value]) => descriptionGroup(key, value)))
                }
              }}
            </Status.Consumer>
          )
        } else {
          return "Currently running in offline demo mode."
        }
      }}
    </Settings.Consumer>
  )
}

export default function ControlPlaneStatusSummary() {
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
