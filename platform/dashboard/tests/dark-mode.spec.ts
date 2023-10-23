// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

test("dark mode persists reload", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // get dark mode state
  const state1 = await page.getByLabel("Dark Mode").isChecked()

  // click dark mode switch
  await page.click('[data-ouia-component-id="dark-mode-switch"]')

  // get dark mode state and verify
  const state2 = await page.getByLabel("Dark Mode").isChecked()
  await expect(state2).toEqual(!state1)

  // Reload dashboard
  await page.reload()

  // check that dark mode persisted
  const state3 = await page.getByLabel("Dark Mode").isChecked()
  await expect(state3).toEqual(state2)
})
