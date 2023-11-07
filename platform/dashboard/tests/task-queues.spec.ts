// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

test("task queues links are visible", async () => {
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

    // Verify that the three showing are the pink, purple, and green cards
    const expectedTaskQueues = [
      { id: "green", count: 1 },
      { id: "pink", count: 2 },
      { id: "purple", count: 1 },
    ]

    await Promise.all(
      expectedTaskQueues.map(({ id, count }) => {
        const selector = [
          '[data-ouia-component-type="PF5/Card"]',
          '[data-ouia-component-type="PF5/DescriptionListGroup"][data-ouia-component-id="Task Queues"]',
          `[data-ouia-component-type="PF5/Button"][data-ouia-component-id="${id}"]`,
        ].join(" ")

        return expect(page.locator(selector))
          .toHaveCount(count, { timeout: 60000 })
          .then(() => console.log("got taskqueue", id, count))
      }),
    )
  }
})
