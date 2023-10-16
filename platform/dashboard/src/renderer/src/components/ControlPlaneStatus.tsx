import { TreeView } from "@patternfly/react-core"

import Settings from "../Settings"
import IconWithLabel from "./IconWithLabel"
import type { Status } from "../main"
import "./ControlPlaneStatus.scss"

export default function ControlPlaneStatus() {
  // treeContent and bodyContent contain bogus data for now
  const treeContent = [
    {
      name: "Cluster Exists",
      id: "djnjnfaijfnain",
    },
    {
      name: "Core",
      id: "fsdbr;dxkc;lks",
    },
    {
      name: "Examples",
      id: "kftjrgsedrtjykdjhsd",
    },
  ]

  const bodyContent = (
    <Settings.Consumer>
      {(settings) => {
        if (settings && !settings.demoMode[0]) {
          return settings.controlPlaneReady ? (
            <TreeView data={treeContent} />
          ) : settings.controlPlaneReady === null ? (
            "Checking on the status of the control plane..."
          ) : (
            "Control plane is offline"
          )
        } else {
          return "Currently running in offline demo mode."
        }
      }}
    </Settings.Consumer>
  )

  function demoModeStatus() {
    return "Running in Demo Mode"
  }

  function controlPlaneStatus(controlPlaneReady: null | Status) {
    const status = controlPlaneReady === null ? "Not Provisioned" : controlPlaneReady ? "Healthy" : "Unhealthy"

    return `JaaS is ${status}`
  }

  return (
    <Settings.Consumer>
      {(settings) => (
        <IconWithLabel
          popoverHeader="JaaS Status"
          popoverBody={bodyContent}
          status={settings?.controlPlaneReady ? "Healthy" : "Unhealthy"}
        >
          {settings && (settings.demoMode[0] ? demoModeStatus() : controlPlaneStatus(settings.controlPlaneReady))}
        </IconWithLabel>
      )}
    </Settings.Consumer>
  )
}
