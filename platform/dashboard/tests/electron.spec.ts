// @ts-check
import { test } from "@playwright/test"
import launchElectron from "./launch-electron"

test("dashboard launched", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath()
  })
  console.log(`this is the app path:`, appPath)

  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow()

  // Print the title.
  console.log(await window.title())

  // Direct Electron console to Node terminal.
  window.on("console", console.log)
})
