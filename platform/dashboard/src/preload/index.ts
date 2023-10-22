/* eslint-disable @typescript-eslint/ban-ts-comment */

import { contextBridge } from "electron"

// Custom APIs for renderer
import jay from "../main/events"

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("live", jay)
  } catch (error) {
    console.error(error)
  }
} else {
  window.live = jay
}
