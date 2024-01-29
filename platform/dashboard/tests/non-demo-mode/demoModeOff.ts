import { Page, Locator, expect } from "@playwright/test"
import launchElectron from "../launch-electron"
import { exec } from "child_process"
import { promisify } from "util"

export async function demoModeOff(): Promise<{ page: Page; demoSwitch: Locator }> {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // Check initial demo mode state
  const demoSwitch = await page.locator(
    '[data-ouia-component-type="PF5/Switch"][data-ouia-component-id="demo-mode-switch"]',
  )
  const state1 = await demoSwitch.isChecked()

  // Disable demo mode if necessary
  if (state1 != false) {
    await demoSwitch.click()
  }
  const state2 = await demoSwitch.isChecked()
  await expect(state2).toEqual(false)

  return { page, demoSwitch }
}

/** This function is temporary. Won't be necessary once we can fully initialize the cluster from within the UI */
export async function hackInit() {
  try {
    const command = promisify(exec)
    const result = await command("../../hack/init.sh")
    return result.stdout
  } catch (e) {
    console.error(`hack/init.sh could not be run: `, e)
    return e
  }
}
