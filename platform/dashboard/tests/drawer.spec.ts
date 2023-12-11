// @ts-check
import { ElectronApplication, type Page, expect, test } from "@playwright/test"
import applications from "./applications"
import launchElectron from "./launch-electron"
import { clickOnCard } from "./card"

import { name } from "../src/renderer/src/content/applications/name"

test.describe.serial("Drawer tests running sequentially", () => {
  let electronApp: ElectronApplication
  let page: Page
  let demoModeStatus: boolean

  const expectedCard1 = applications[3].application
  const expectedCard2 = applications[2].application

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
      await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: name }).click()

      // click on one of the cards
      await clickOnCard(page, expectedCard1)

      // check that the drawer for that card opened
      const id = "applications." + expectedCard1
      const drawer = await page.locator(
        `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${id}"]`,
      )
      await expect(drawer).toBeVisible()

      // verify that the drawer that opened matched the card that was clicked
      const drawerTitle = await drawer.locator(`[data-ouia-component-type="PF5/Title"]`)
      await expect(drawerTitle).toContainText(expectedCard1)
    }
  })

  test("drawer content changes when different card is clicked", async () => {
    // If in demo mode, then continue with test to check that drawer content changed
    if (demoModeStatus) {
      // click a different card than the one that was used to open the drawer
      await clickOnCard(page, expectedCard2)

      // verify that the drawer is still open and visible
      const id = "applications." + expectedCard2
      const drawer = await page.locator(
        `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${id}"]`,
      )
      await expect(drawer).toBeVisible()

      // verify that the drawer content changed
      const drawerTitle = await drawer.locator(`[data-ouia-component-type="PF5/Title"]`)
      await expect(drawerTitle).toContainText(expectedCard2)
    }
  })

  test("drawer closes when the card that opened it is clicked", async () => {
    // If in demo mode, then continue with test to close drawer
    if (demoModeStatus) {
      // click the card that was used to open the drawer
      await clickOnCard(page, expectedCard2)

      // verify that the drawer is closed
      const id = "applications." + expectedCard2
      const drawer = await page.locator(
        `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${id}"]`,
      )
      await expect(drawer).toBeHidden()
    }
  })
})
