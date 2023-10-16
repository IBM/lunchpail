import { createContext, useState } from "react"

import type { Status } from "./main"
import type { Dispatch, SetStateAction } from "react"
type State<T> = [T, Dispatch<SetStateAction<T>>, (evt: unknown, val: T) => void]

type SettingsType = null | { darkMode: State<boolean>; demoMode: State<boolean>; controlPlaneReady: null | Status }

const Settings = createContext<SettingsType>(null)
export default Settings

type SettingsKey = "darkMode" | "demoMode"

/** Restore previously selected demoMode setting */
function restoreBoolean(key: SettingsKey): boolean {
  const setting = localStorage.getItem(key)
  if (setting === "false") {
    return false
  } else {
    // default value: true
    return true
  }
}

/** Persist a demoMode setting */
function saveBoolean(key: SettingsKey, value: boolean): void {
  localStorage.setItem(key, value.toString())
}

function state(key: SettingsKey, onChange?: (val: boolean) => void): State<boolean> {
  const initialValue = restoreBoolean(key)
  const state = useState(initialValue)
  const origSet = state[1]

  if (onChange) {
    onChange(initialValue)
  }

  // override the updater so that we can persist the choice
  state[1] = (action: SetStateAction<boolean>) => {
    const newValue = typeof action === "boolean" ? action : action(state[0])
    if (onChange) {
      onChange(newValue)
    }

    saveBoolean(key, newValue) // persist
    origSet(action) // react
  }

  return [...state, (_, val: boolean) => state[1](val)]
}

export function demoModeState() {
  return state("demoMode")
}

function onChangeDarkMode(useDarkMode: boolean) {
  if (useDarkMode) document.querySelector("html")?.classList.add("pf-v5-theme-dark")
  else document.querySelector("html")?.classList.remove("pf-v5-theme-dark")
}

export function darkModeState() {
  return state("darkMode", onChangeDarkMode)
}
