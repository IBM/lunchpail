import { contextBridge } from "electron"
//import { electronAPI } from "@electron-toolkit/preload"

// Custom APIs for renderer
import jaas from "../main/events"

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    //contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("jaas", jaas)
  } catch (error) {
    console.error(error)
  }
} else {
  // @xxx-ts-ignore (define in dts)
  //window.electron = electronAPI
  // @xxx-ts-ignore (define in dts)
  window.jaas = jaas
}
