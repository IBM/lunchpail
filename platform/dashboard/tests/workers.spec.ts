// @ts-check
import { ElectronApplication, Page, expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"
import navigateToQueueTab from "./navigate-to-queue-tab"
import expectedApplications from "./applications"

import { name } from "../src/renderer/src/content/applications/name"

test.describe.serial("workers tests running sequentially", () => {
  let electronApp: ElectronApplication
  let page: Page
  let demoModeStatus: boolean
  let workerName: string
  const { application: expectedApp, taskqueue: expectedTaskQueue } = expectedApplications[0]

  test("Navigate to Queue tab for application", async () => {
    // Launch Electron app.
    electronApp = await launchElectron()

    // Get the first page that the app opens, wait if necessary.
    page = await electronApp.firstWindow()

    // Check if we are in demo mode (should be true by default)
    demoModeStatus = await page.getByLabel("Demo").isChecked()
    console.log(`Demo mode on?: ${demoModeStatus}`)

    // get Applications tab element from the sidebar and click to activate Application gallery
    await page.getByRole("link", { name }).click()

    await navigateToQueueTab(page, expectedApp, expectedTaskQueue)
  })

  test("'Add Compute' button opens 'Create Compute Pool' modal", async () => {
    // click on the button to bring up the new worker pool wizard
    await page.getByRole("link", { name: "Add Compute" }).click()

    // check that modal opened
    const modal = await page.locator(`[data-ouia-component-type="PF5/ModalContent"]`)
    await expect(modal).toBeVisible()
  })

  test("'Create Compute Pool' modal is autopopulated", async () => {
    // check that 'Application Code' drop down matches expectedApp
    await expect(page.getByRole("button", { name: expectedApp })).toBeVisible()

    // check that 'Task Queue' drop down matches expectedTaskQueue
    await expect(page.getByRole("button", { name: expectedTaskQueue })).toBeVisible()
  })

  test("Clicking 'Next' and 'Register Compute Pool' in modal", async () => {
    // click 'Next' and verify that we moved on to 'Review' window
    await page.getByRole("button", { name: "Next" }).click()
    const modalPage = await page.locator(`.pf-v5-c-wizard__toggle`)
    await expect(modalPage).toContainText("Review")

    // click 'Register Compute Pool'
    await page.getByRole("button", { name: "Create Pool" }).click()

    // Check that there is a Drawer on the screen, and extract it's name
    const drawer = await page.locator(`[data-ouia-component-type="PF5/DrawerPanelContent"]`)
    await expect(drawer).toBeVisible()
    workerName = await drawer.locator(`[data-ouia-component-type="PF5/Title"]`).innerText()

    // Check that the Drawer updated with new worker information
    const workerDrawer = await page.locator(`[data-ouia-component-id="workerpools.${workerName}"]`)
    await expect(workerDrawer).toBeVisible()
  })

  test("Check the Compute tab for the new worker we created", async () => {
    // click back to Compute tab element from the sidebar
    await page.locator(`[data-ouia-component-type="PF5/NavItem"]`, { hasText: "Compute" }).click()

    // check that the drawer with the worker information is still open
    const workerDrawer = await page.locator(`[data-ouia-component-id="workerpools.${workerName}"]`)
    await expect(workerDrawer).toBeVisible()

    // check that there is a card that matches the newly created workerName, expectedApp and expectedTaskQueue
    const card = await page.locator(`[data-ouia-component-type="PF5/Card"][data-ouia-component-id=${workerName}]`)
    await expect(card).toBeVisible()

    const code = await card.locator(`[data-ouia-component-id="${name}"]`)
    await expect(code).toContainText(expectedApp, { timeout: 60000 })

    // we have removed taskqueues from the Card
    // const taskqueue = await card.locator(`[data-ouia-component-id="Task Queues"]`)
    // await expect(taskqueue).toContainText(expectedTaskQueue, { timeout: 60000 })
  })
})
