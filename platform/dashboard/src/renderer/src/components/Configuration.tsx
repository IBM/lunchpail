import { useContext } from "react"

import { Switch, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from "@patternfly/react-core"

import Settings from "../Settings"

export const alignRight = { default: "alignRight" as const }
export const spaceItemsLg = { default: "spaceItemsLg" as const }

function Switches() {
  const settings = useContext(Settings)

  return (
    <ToolbarGroup align={alignRight} spaceItems={spaceItemsLg}>
      <ToolbarItem>
        <Switch
          className="codeflare--switch"
          ouiaId="demo-mode-switch"
          label="Demo"
          isChecked={settings?.demoMode[0]}
          onChange={settings?.demoMode[2]}
        />
      </ToolbarItem>
      <ToolbarItem>
        <Switch
          className="codeflare--switch"
          ouiaId="dark-mode-switch"
          label="Dark Mode"
          isChecked={settings?.darkMode[0]}
          onChange={settings?.darkMode[2]}
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
