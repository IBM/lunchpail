import { createContext, useState } from "react"

import type { Dispatch, SetStateAction } from "react"
export type State<T> = [T, Dispatch<SetStateAction<T>>, (evt: unknown, val: T) => void]

export type CurrentSettings = null | {
  darkMode: State<boolean>
  demoMode: State<boolean>
  form: State<string>
}

const Settings = createContext<CurrentSettings>(null)
export default Settings

type SettingsKey = keyof NonNullable<CurrentSettings>

/** Restore previously selected Setting */
function restore(key: SettingsKey) {
  return localStorage.getItem(key)
}

/** Restore previously selected boolean Setting */
function restoreBoolean(key: SettingsKey) {
  const setting = restore(key)
  if (setting === "false") {
    return false
  } else if (setting === "true") {
    return true
  } else {
    return null
  }
}

/** Persist a Setting */
function save(key: SettingsKey, value: string | boolean | number): void {
  localStorage.setItem(key, value.toString())
}

function state<T extends string | boolean | number>(
  key: SettingsKey,
  defaultValue: T,
  onChange?: (val: T) => void,
): State<T> {
  const initialValue = ((typeof defaultValue === "boolean" ? restoreBoolean(key) : restore(key)) ?? defaultValue) as T

  const state = useState<T>(initialValue)
  const origSet = state[1]

  if (onChange) {
    onChange(initialValue)
  }

  // override the updater so that we can persist the choice
  state[1] = (action: SetStateAction<T>) => {
    const newValue = typeof action === "function" ? action(state[0]) : action
    if (onChange) {
      onChange(newValue)
    }

    save(key, newValue) // persist
    origSet(action) // react
  }

  return [...state, (_, val: T) => state[1](val)]
}

function onChangeDemoMode(useDemoMode: boolean) {
  if (useDemoMode) {
    window.jaas = window.demo
  } else {
    window.jaas = window.live
  }
}

export function demoModeState() {
  // default to true
  return state<boolean>("demoMode", true, onChangeDemoMode)
}

export function formState() {
  return state<string>("form", "")
}

function onChangeDarkMode(useDarkMode: boolean) {
  if (useDarkMode) document.querySelector("html")?.classList.add("pf-v5-theme-dark")
  else document.querySelector("html")?.classList.remove("pf-v5-theme-dark")
}

export function darkModeState() {
  // default to false
  return state<boolean>("darkMode", false, onChangeDarkMode)
}
