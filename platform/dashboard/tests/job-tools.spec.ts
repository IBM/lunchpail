// @ts-check
import { Page, expect, test } from "@playwright/test"

import launchElectron from "./launch-electron"
import { missingCard } from "./card"
import expectedApplications from "./applications"
import { navigateToCard } from "./navigate-to-queue-tab"
import { name } from "../src/renderer/src/content/runs/name"

test.describe.serial("job tools running sequentially", () => {
  let page: Page

  const { application: expectedApp } = expectedApplications[0]

  test("Activate 'Jobs' tab", async () => {
    // Launch Electron app.
    const electronApp = await launchElectron()

    // Get the first page that the app opens, wait if necessary.
    page = await electronApp.firstWindow()

    // Check if we are in demo mode (should be true by default)
    const demoModeStatus = await page.getByLabel("Demo").isChecked()
    console.log(`Demo mode on?: ${demoModeStatus}`)

    // get 'Jobs' tab element from the sidebar and click to activate Jobs gallery
    await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: name }).click()
  })

  test("Trash button opens 'Confirm Delete' modal", async () => {
    // navigate to a given job card's drawer
    const drawer = await navigateToCard(page, expectedApp)

    // click on trash button
    await drawer.locator(`[data-ouia-component-id="trashButton"]`).click()

    // check that deletion modal opened
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    await expect(modal).toBeVisible()
  })

  test("Confirm job deletion", async () => {
    // click on Confirm button
    await page.getByRole("button", { name: "Confirm" }).click()

    // verify that intended job was deleted
    await missingCard(page, expectedApp)
  })
})
