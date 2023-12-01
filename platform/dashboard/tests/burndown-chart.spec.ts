// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"
import expectedApplications from "./applications"
import { navigateToCard, navigateToTab } from "./navigate-to-queue-tab"

import { name } from "../src/renderer/src/content/applications/name"

test("burn down charts are visible", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // Check if we are in demo mode (should be true by default)
  const demoModeStatus = await page.getByLabel("Demo").isChecked()
  console.log(`Demo mode on?: ${demoModeStatus}`)

  // If in demo mode, then continue with burn down chart test
  if (demoModeStatus) {
    // Click Job Definitions tab from the sidebar to activate the Job Definitions gallery
    await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: name }).click()

    // Verify that the burn down chart for each job definition is visible
    for await (const { application } of expectedApplications) {
      const drawer = await navigateToCard(page, application)
      await navigateToTab(drawer, "Status")

      // get number of uassigned tasks for a given job definition
      const unassignedTasksNum = await (
        await drawer
          .locator(`[data-ouia-component-type="PF5/DescriptionListGroup"][data-ouia-component-id="Unassigned Tasks"]`)
          .innerText()
      ).replace(/Unassigned Tasks /, "")
      console.log(`Number of unassigned tasks for application=${application}: ${unassignedTasksNum}`)

      // Navigate to burndown chart tab
      await navigateToTab(drawer, "Burndown")

      // get contents of burndown tab
      const burndownContent = await drawer.locator(
        '[data-ouia-component-type="PF5/TabContent"][data-ouia-component-id="Burndown"]',
      )

      // If unassigned tasks are less than 2, the burndownContent should say "Not enough data, yet, to show the burndown chart"
      if (parseInt(unassignedTasksNum) < 2) {
        console.log(
          `For application=${application}, unassigned tasks=${unassignedTasksNum} so output should be 'Not enough data...'`,
        )
        await expect(burndownContent).toHaveText("Not enough data, yet, to show the burndown chart")
      }
      // If there are at least 2 unassigned tasks, then we should see the burndown chart
      else {
        console.log(
          `For application=${application}, unassigned tasks=${unassignedTasksNum} so output should be burndown chart`,
        )
        const tasksOverTime = await drawer.locator(
          `[data-ouia-component-type="PF5/DescriptionListGroup"][data-ouia-component-id="Unassigned Tasks over Time"]`,
        )
        await expect(tasksOverTime).toBeVisible({ timeout: 60000 })
      }
    }
  }
})
