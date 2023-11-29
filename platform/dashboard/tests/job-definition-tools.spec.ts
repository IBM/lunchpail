// @ts-check
import { Page, expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"
import expectedApplications from "./applications"
import { navigateToCard } from "./navigate-to-queue-tab"
import { name } from "../src/renderer/src/content/applications/name"

test.describe.serial("job definition tools running sequentially", () => {
  let page: Page

  const { application: expectedApp } = expectedApplications[0]

  test("Activate 'Job Definitions' tab", async () => {
    // Launch Electron app.
    const electronApp = await launchElectron()

    // Get the first page that the app opens, wait if necessary.
    page = await electronApp.firstWindow()

    // Check if we are in demo mode (should be true by default)
    const demoModeStatus = await page.getByLabel("Demo").isChecked()
    console.log(`Demo mode on?: ${demoModeStatus}`)

    // get 'Job Definitions' tab element from the sidebar and click to activate Job Definitions gallery
    await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: name }).click()
  })

  test("Trash button opens 'Confirm Delete' modal", async () => {
    // navigate to a given job definition card's drawer
    const drawer = await navigateToCard(page, expectedApp)

    // click on trash button
    await drawer.locator(`[data-ouia-component-id="trashButton"]`).click()

    // check that deletion modal opened
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    await expect(modal).toBeVisible()
  })

  test("Confirm job definition deletion", async () => {
    // click on Confirm button
    await page.getByRole("button", { name: "Confirm" }).click()

    // verify that intended job definition was deleted
    const appCard = page.locator(`[data-ouia-component-type="PF5/Card"][data-ouia-component-id="${expectedApp}"]`)
    await expect(appCard).toHaveCount(0)
  })
})
