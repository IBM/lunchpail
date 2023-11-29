// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

test("demo mode persists reload", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // get dark mode state
  const demoSwitch = await page.locator(
    '[data-ouia-component-type="PF5/Switch"][data-ouia-component-id="demo-mode-switch"]',
    { hasText: "Demo" },
  )
  const state1 = await demoSwitch.isChecked()
  await expect(state1).toEqual(true)

  // click dark mode switch
  await demoSwitch.click()

  // get demo mode state and verify
  const state2 = await demoSwitch.isChecked()
  await expect(state2).not.toEqual(state1)

  // Reload dashboard
  await page.reload()

  // check that demo mode persisted
  const state3 = await demoSwitch.isChecked()
  await expect(state3).toEqual(false)
  await expect(state2).toEqual(false)
  await expect(state3).toEqual(state2)
})
