// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

test("drawer opens", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // Check if we are in demo mode (should be true by default)
  const demoModeStatus = await page.getByLabel("Demo Mode").isChecked()
  console.log(`Demo mode on?: ${demoModeStatus}`)

  // If in demo mode, then continue with test to open drawers
  if (demoModeStatus) {
    // Get Applications tab element from the sidebar and click, to
    // activate the Application gallery
    await page.getByRole("link", { name: "Applications" }).click()

    // click on one of the cards
    const expectedCard = "worm"
    await page.locator(`[data-ouia-component-id="${expectedCard}"]`).click()

    // check that the drawer for that card opened
    const id = "applications." + expectedCard
    const drawer = await page.locator(
      `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${id}"]`,
    )
    await expect(drawer).toBeVisible()

    // verify that the drawer that opened matched the card that was clicked
    const drawerTitle = await drawer.locator(`[data-ouia-component-type="PF5/Title"]`)
    await expect(drawerTitle).toContainText(expectedCard)
  }
})
