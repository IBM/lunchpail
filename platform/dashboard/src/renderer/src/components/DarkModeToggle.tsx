import { useCallback, useContext } from "react"
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core"

import Settings from "../Settings"

import DarkModeOnIcon from "@patternfly/react-icons/dist/esm/icons/moon-icon"
import DarkModeOffIcon from "@patternfly/react-icons/dist/esm/icons/sun-icon"

export default function DarkModeToggle() {
  const settings = useContext(Settings)

  const toggleOn = useCallback(() => settings?.darkMode[1](true), [settings?.darkMode[1]])
  const toggleOff = useCallback(() => settings?.darkMode[1](false), [settings?.darkMode[1]])

  return (
    <ToggleGroup>
      <ToggleGroupItem
        icon={<DarkModeOffIcon />}
        aria-label="toggle dark mode off"
        buttonId="dark-mode-toggle-off"
        data-ouia-component-id="dark-mode-toggle"
        isSelected={!settings?.darkMode[0]}
        onChange={toggleOff}
      />
      <ToggleGroupItem
        icon={<DarkModeOnIcon />}
        aria-label="toggle dark mode on"
        buttonId="dark-mode-toggle-on"
        data-ouia-component-id="dark-mode-toggle"
        isSelected={settings?.darkMode[0]}
        onChange={toggleOn}
      />
    </ToggleGroup>
  )
}
