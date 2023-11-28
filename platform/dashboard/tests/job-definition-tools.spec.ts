// @ts-check
import { ElectronApplication, Locator, Page, expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"
import { navigateToCard } from "./navigate-to-queue-tab"
import expectedApplications from "./applications"

import { name } from "../src/renderer/src/content/applications/name"

test.describe.serial("job definition tools running sequentially", () => {
  let electronApp: ElectronApplication
  let page: Page
  let demoModeStatus: boolean
  let drawer: Locator

  const { application: expectedApp } = expectedApplications[0]

  test("Navigate to drawer for a given job definition card", async () => {
    // Launch Electron app.
    electronApp = await launchElectron()

    // Get the first page that the app opens, wait if necessary.
    page = await electronApp.firstWindow()

    // Check if we are in demo mode (should be true by default)
    demoModeStatus = await page.getByLabel("Demo").isChecked()
    console.log(`Demo mode on?: ${demoModeStatus}`)

    // get Applications tab element from the sidebar and click to activate Application gallery
    await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: name }).click()

    drawer = await navigateToCard(page, expectedApp)
  })

  test("Trash button opens 'Confirm Delete' modal", async () => {
    // click on trash button
    await drawer.locator(`[data-ouia-component-id="trashButton"]`).click()

    // check that deletion modal opened
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    await expect(modal).toBeVisible()
  })
})
