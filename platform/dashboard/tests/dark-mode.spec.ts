// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

test("dark mode persists reload", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // get dark mode state
  const state1 = await page.locator('.pf-m-selected[aria-label="toggle dark mode on"]').isVisible()

  // click dark mode switch
  await page.locator('[data-ouia-component-id="dark-mode-toggle"] button:not(.pf-m-selected)').click()

  // get dark mode state and verify
  const state2 = await page.locator('.pf-m-selected[aria-label="toggle dark mode on"]').isVisible()
  await expect(state2).toEqual(!state1)

  // Reload dashboard
  await page.reload()

  // check that dark mode persisted
  const state3 = await page.locator('.pf-m-selected[aria-label="toggle dark mode on"]').isVisible()
  await expect(state3).toEqual(state2)
})
