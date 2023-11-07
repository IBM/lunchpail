// @ts-check
import { ElectronApplication, Page, expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

test.describe.serial("Drawer tests running sequentially", () => {
  let electronApp: ElectronApplication
  let page: Page
  let demoModeStatus: boolean
  let expectedCard = "worm"

  test("drawer opens", async () => {
    // Launch Electron app.
    electronApp = await launchElectron()

    // Get the first page that the app opens, wait if necessary.
    page = await electronApp.firstWindow()

    // Check if we are in demo mode (should be true by default)
    demoModeStatus = await page.getByLabel("Demo").isChecked()
    console.log(`Demo mode on?: ${demoModeStatus}`)

    // If in demo mode, then continue with test to open drawers
    if (demoModeStatus) {
      // get Applications tab element from the sidebar and click to activate Application gallery
      await page.getByRole("link", { name: "Code" }).click()

      // click on one of the cards
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

  test("drawer content changes when different card is clicked", async () => {
    // If in demo mode, then continue with test to check that drawer content changed
    if (demoModeStatus) {
      // click a different card than the one that was used to open the drawer
      expectedCard = "pig"
      await page.locator(`[data-ouia-component-id="${expectedCard}"]`).click()

      // verify that the drawer is still open and visible
      const id = "applications." + expectedCard
      const drawer = await page.locator(
        `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${id}"]`,
      )
      await expect(drawer).toBeVisible()

      // verify that the drawer content changed
      const drawerTitle = await drawer.locator(`[data-ouia-component-type="PF5/Title"]`)
      await expect(drawerTitle).toContainText(expectedCard)
    }
  })

  test("drawer closes when the card that opened it is clicked", async () => {
    // If in demo mode, then continue with test to close drawer
    if (demoModeStatus) {
      // click the card that was used to open the drawer
      await page.locator(`[data-ouia-component-id="${expectedCard}"]`).click()

      // verify that the drawer is closed
      const id = "applications." + expectedCard
      const drawer = await page.locator(
        `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${id}"]`,
      )
      await expect(drawer).toBeHidden()
    }
  })
})
