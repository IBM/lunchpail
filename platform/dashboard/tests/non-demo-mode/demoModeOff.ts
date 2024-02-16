import { Page, Locator, expect } from "@playwright/test"
import launchElectron from "../launch-electron"

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
