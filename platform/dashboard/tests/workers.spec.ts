// @ts-check
import { Page, expect, test } from "@playwright/test"

import launchElectron from "./launch-electron"
import expectedApplications from "./applications"
// import { visibleCard, missingCard } from "./card"
import { navigateToCard, navigateToTab } from "./navigate-to-queue-tab"

import { name } from "../src/renderer/src/content/runs/name"

test.describe.serial("workers tests running sequentially", () => {
  let page: Page
  let computePoolName: string
  const { application: expectedApp } = expectedApplications[0]

  test(`Navigate to Compute tab for ${name}`, async () => {
    // Launch Electron app.
    const electronApp = await launchElectron()

    // Get the first page that the app opens, wait if necessary.
    page = await electronApp.firstWindow()

    // Check if we are in demo mode (should be true by default)
    const demoModeStatus = await page.getByLabel("Demo").isChecked()
    console.log(`Demo mode on?: ${demoModeStatus}`)

    // get 'Jobs' tab element from the sidebar and click to activate Job Definition gallery
    await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: name }).click()

    const drawer = await navigateToCard(page, expectedApp)
    await navigateToTab(drawer, "Compute", name)
  })

  test("'Add Compute' button opens 'Create Compute Pool' modal", async () => {
    // click on the button to bring up the new worker pool wizard
    const drawer = await page.locator(`[data-ouia-component-type="PF5/DrawerPanelContent"]`)
    await drawer.getByRole("link", { name: "Add Compute" }).click()

    // check that modal opened
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    await expect(modal).toBeVisible()
  })

  test("Click Next to get to the Configure wizard step", async () => {
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    const nextButton = await modal.getByRole("button", { name: "Next" })
    await expect(nextButton).toBeVisible()
    await nextButton.click()
  })

  test("'Create Compute Pool' modal is autopopulated", async () => {
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)

    // check that 'Definition' drop down matches expectedApp
    const input = await modal.locator('input[name="application"]') // getByRole("input", { name: "application" }))
    await expect(input).toBeVisible()
    await expect(input).toHaveCount(1)
    await expect(input).toHaveValue(expectedApp)

    // check that 'Task Queue' drop down matches expectedTaskQueue
    // no longer shown in the UI
    // await expect(modal.getByRole("button", { name: expectedTaskQueue })).toBeVisible()
  })

  test("Click Next to get to the Register wizard step", async () => {
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    const nextButton = await modal.getByRole("button", { name: "Next" })
    await expect(nextButton).toBeVisible()
    await nextButton.click()
  })

  test("Clicking 'Next' and 'Register Compute Pool' in modal", async () => {
    // click 'Next' and verify that we moved on to 'Review' window
    await page.getByRole("button", { name: "Next" }).click()
    const modalPage = await page.locator(`.pf-v5-c-wizard__toggle`)
    await expect(modalPage).toContainText("Review")

    // click 'Create Worker Pool'
    await page.getByRole("button", { name: "Create Worker Pool" }).click()

    // Check that there is a Drawer on the screen, and extract it's name
    const drawer = await page.locator(`[data-ouia-component-type="PF5/DrawerPanelContent"]`)
    await expect(drawer).toBeVisible()
    computePoolName = await drawer.locator(`[data-ouia-component-type="PF5/Title"]`).innerText()

    // Check that the Drawer updated with new worker information
    const computePoolDrawer = await page.locator(`[data-ouia-component-id="workerpools.${computePoolName}"]`)
    await expect(computePoolDrawer).toBeVisible()
  })

  /* test("Check the Compute Pools tab for the new worker we created", async () => {
    // click back to Compute Pools tab element from the sidebar
    const compute = await page.locator(`[data-ouia-component-type="PF5/NavExpandable"]`, { hasText: "Compute" })
    await compute.click()
    await compute.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: "Compute Pools" }).click()

    // check that the drawer with the worker information is still open
    const computePoolDrawer = await page.locator(`[data-ouia-component-id="workerpools.${computePoolName}"]`)
    await expect(computePoolDrawer).toBeVisible()

    // check that there is a card that matches the newly created computePoolName
    const card = await visibleCard(page, computePoolName)

    // check that the new card contains the expectedApp
    const code = await card.locator(`[data-ouia-component-id="${name}"]`)
    await expect(code).toContainText(expectedApp)

    // we have removed taskqueues from the Card
    // const taskqueue = await card.locator(`[data-ouia-component-id="Task Queues"]`)
    // await expect(taskqueue).toContainText(expectedTaskQueue)
  }) */

  test("Trash button opens 'Confirm Delete' modal", async () => {
    // navigate to a given compute pool's drawer
    const computePoolDrawer = await page.locator(`[data-ouia-component-id="workerpools.${computePoolName}"]`)

    // click on trash button
    await computePoolDrawer.locator(`[data-ouia-component-id="trashButton"]`).click()

    // check that deletion modal opened
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    await expect(modal).toBeVisible()
  })

  /* test("Confirm compute pool's deletion", async () => {
    // click on Confirm button
    await page.getByRole("button", { name: "Confirm" }).click()

    // verify that intended compute pool's was deleted. First, navigate back to 'Compute Pools' tab
    const compute = await page.locator(`[data-ouia-component-type="PF5/NavExpandable"]`, { hasText: "Compute" })
    await compute.click()
    await compute.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: "Compute Pools" }).click()

    // Now verify that there is no card that matches the previously created compute pool
    await missingCard(page, computePoolName)
  }) */
})
