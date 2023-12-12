import { useContext } from "react"

import { Switch, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from "@patternfly/react-core"

import Settings from "../Settings"

export const spaceItems = { default: "spaceItemsMd" as const }

function Switches() {
  const settings = useContext(Settings)

  return (
    <ToolbarGroup spaceItems={spaceItems}>
      <ToolbarItem>
        <Switch
          className="codeflare--switch"
          ouiaId="demo-mode-switch"
          label="Demo Mode"
          isChecked={settings?.demoMode[0]}
          onChange={settings?.demoMode[2]}
        />
      </ToolbarItem>
    </ToolbarGroup>
  )
}

export default function Configuration() {
  return (
    <Toolbar>
      <ToolbarContent isExpanded={false}>
        <Switches />
      </ToolbarContent>
    </Toolbar>
  )
}
