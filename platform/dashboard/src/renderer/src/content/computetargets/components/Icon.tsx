import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, Tooltip } from "@patternfly/react-core"

import type Props from "./Props"
import { singular as computetarget } from "../name"
import { controlplaneHealth, workerhostHealth } from "./HealthBadge"
import { singular as workerpool } from "@jay/resources/workerpools/name"

import HomeIcon from "@patternfly/react-icons/dist/esm/icons/laptop-house-icon"
import WorkersIcon from "@patternfly/react-icons/dist/esm/icons/robot-icon"

const tooltips = {
  healthy: "It is healthy.",
  unhealthy: "Warning: it is not healthy.",
  controlplane: `This ${computetarget} houses the main JaaS control plane.`,
  workerhost: {
    enabled: `This ${computetarget} is enabled to host ${workerpool} Workers.`,
    disabled: (
      <>
        This {computetarget} <strong>does not</strong> have support to host {workerpool} Workers.
      </>
    ),
  },
}

function controlPlaneIcons(props: Props) {
  if (props.spec.jaasManager) {
    const healthy = controlplaneHealth(props)
    const className = healthy ? "codeflare--status-active" : "codeflare--status-offline"
    return [
      <ToolbarItem key="controlplane">
        <Tooltip content={[tooltips.controlplane, healthy ? tooltips.healthy : tooltips.unhealthy].join(" ")}>
          <HomeIcon className={className} />
        </Tooltip>
      </ToolbarItem>,
    ]
  } else {
    return []
  }
}

function workerHostIcons(props: Props) {
  const healthy = workerhostHealth(props) === "Online"
  const className = healthy ? "codeflare--status-active" : "codeflare--status-unknown"
  return [
    <ToolbarItem key="workers">
      <Tooltip content={tooltips.workerhost[healthy ? "enabled" : "disabled"]}>
        <WorkersIcon className={className} />
      </Tooltip>
    </ToolbarItem>,
  ]
}

const noPadding = { padding: 0 }

export default function Icon(props: Props) {
  return (
    <Toolbar>
      <ToolbarContent alignItems="center" style={noPadding}>
        <ToolbarGroup>
          {controlPlaneIcons(props)}
          {workerHostIcons(props)}
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  )
}
