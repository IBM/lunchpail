// @ts-check
import { test } from "@playwright/test"
import launchElectron from "./launch-electron"
import { navigateToCard } from "./navigate-to-queue-tab"
import expectedApplications from "./applications"

import { name as TaskQueues } from "../src/renderer/src/content/taskqueues/name"

test("task queues are visible", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // Check if we are in demo mode (should be true by default)
  const demoModeStatus = await page.getByLabel("Demo").isChecked()
  console.log(`Demo mode on?: ${demoModeStatus}`)

  // If in demo mode, then continue with Task queue card test
  if (demoModeStatus) {
    // Get TaskQueues tab element from the sidebar and click, to
    // activate the TaskQueues gallery
    await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: TaskQueues }).click()

    for await (const { taskqueue } of expectedApplications) {
      console.log(`Waiting for taskqueue=${taskqueue}`)
      await navigateToCard(page, taskqueue, "taskqueues")
      console.log(`Got queue manager tab for taskqueue=${taskqueue}`)
    }
  }
})
