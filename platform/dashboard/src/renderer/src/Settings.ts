import { createContext } from "react"

import type { Dispatch, SetStateAction } from "react"

type SettingsType = null | { demoMode: [boolean, Dispatch<SetStateAction<boolean>>]; controlPlaneReady: null | boolean }

const Settings = createContext<SettingsType>(null)
export default Settings

/** Restore previously selected demoMode setting */
export function restoreDemoMode(): boolean {
  const setting = localStorage.getItem("demoMode")
  if (setting === "false") {
    return false
  } else {
    // default value: true
    return true
  }
}

/** Persist a demoMode setting */
export function saveDemoMode(demoMode: boolean): void {
  localStorage.setItem("demoMode", demoMode.toString())
}
