// @ts-check
import { test } from "@playwright/test"
import launchElectron from "./launch-electron"
import navigateToQueueTab from "./navigate-to-queue-tab"
import expectedApplications from "./applications"

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
    // Get Applications tab element from the sidebar and click, to
    // activate the Application gallery
    await page.getByRole("link", { name: "Code" }).click()

    for await (const { application, taskqueue } of expectedApplications) {
      console.log(`Waiting for application=${application} taskqueue=${taskqueue}`)
      await navigateToQueueTab(page, application, taskqueue)
      console.log(`Got queue manager tab for application=${application} taskqueue=${taskqueue}`)
    }
  }
})
