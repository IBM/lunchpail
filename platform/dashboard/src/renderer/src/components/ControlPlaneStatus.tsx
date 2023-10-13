import Settings from "../Settings"

import { TreeView, Popover } from "@patternfly/react-core"
import IconWithLabel from "./IconWithLabel"
import LiveIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon"
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon"
import DemoIcon from "@patternfly/react-icons/dist/esm/icons/flask-icon"
import IssueIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon"
import CheckingIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon"

export default function ControlPlaneStatus() {
  // treeContent and bodyContent contain bogus data for now
  const treeContent = [
    {
      name: "Controller: Ready",
      id: "djnjnfaijfnain",
    },
    {
      name: "Control Plane: Ready",
      id: "fsdbr;dxkc;lks",
      children: [
        {
          name: "controllers: Ready",
          id: "example4-App1",
        },
        {
          name: "CRDs: Installed",
          id: "lgjslifeifszni",
        },
      ],
      defaultExpanded: false,
    },
    {
      name: "Targets: (3)",
      id: "kftjrgsedrtjykdjhsd",
      children: [
        {
          name: "LSF: Ready",
          id: "example4-App1",
        },
        {
          name: "Kubernetes: ...",
          id: "example4-App1",
          children: [
            {
              name: "A (ready)",
              id: "hlfjnaljfnkj",
            },
            {
              name: "B (credentials invalid)",
              id: "hlfjnaljfnkj",
            },
            {
              name: "C (some status)",
              id: "hlfjnaljfnkj",
            },
          ],
        },
        {
          name: "IBM Cloud VSI's: invalid credentials",
        },
      ],
      defaultExpanded: false,
    },
    {
      name: "Data Sources: (2)",
      id: "ktfdykdjaesgz",
      children: [
        {
          name: "AWS S3:",
          id: "example4-App1",
          children: [
            {
              name: "foo (ready)",
              id: "hsektjdgsfd",
            },
            {
              name: "bar (invalid credentials)",
              id: "jgilsejfsijf;oi",
            },
          ],
        },
      ],
      defaultExpanded: false,
    },
  ]

  const bodyContent = (
    <Settings.Consumer>
      {(settings) => {
        if (settings && !settings.demoMode[0]) {
          return settings.controlPlaneReady ? (
            <TreeView data={treeContent} icon={<InfoCircleIcon />} expandedIcon={<LiveIcon />} />
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
    return IconWithLabel("Offline Demo", <DemoIcon className="codeflare--demo-mode" />)
  }

  function controlPlaneStatus(controlPlaneReady: null | boolean) {
    return IconWithLabel(
      "Platform Status",
      controlPlaneReady === null ? (
        <CheckingIcon className="codeflare--status-unknown" />
      ) : controlPlaneReady ? (
        <LiveIcon className="codeflare--status-online" />
      ) : (
        <IssueIcon className="codeflare--status-offline" />
      ),
    )
  }

  return (
    <Popover headerContent="Status" bodyContent={bodyContent}>
      <Settings.Consumer>
        {(settings) =>
          settings && (settings.demoMode[0] ? demoModeStatus() : controlPlaneStatus(settings.controlPlaneReady))
        }
      </Settings.Consumer>
    </Popover>
  )
}
