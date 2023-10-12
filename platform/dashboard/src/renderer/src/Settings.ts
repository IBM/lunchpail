import { createContext } from "react"
import type { Dispatch, SetStateAction } from "react"

type SettingsType = null | { demoMode: [boolean, Dispatch<SetStateAction<boolean>>]; controlPlaneReady: boolean }

const Settings = createContext<SettingsType>(null)
export default Settings
