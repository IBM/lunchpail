// @ts-check
import { test } from "@playwright/test"

import applications from "./applications"
import { visibleCard } from "./card"
import launchElectron from "./launch-electron"

import { name } from "../src/renderer/src/content/runs/name"

test("4 applications visible when in demo mode", async () => {
  // Launch Electron app.
  const electronApp = await launchElectron()

  // Get the first page that the app opens, wait if necessary.
  const page = await electronApp.firstWindow()

  // Check if we are in demo mode (should be true by default)
  const demoModeStatus = await page.getByLabel("Demo").isChecked()
  console.log(`Demo mode on?: ${demoModeStatus}`)

  // If in demo mode, then continue with Applications card test
  if (demoModeStatus) {
    // Get Applications tab element from the sidebar and click
    await page.getByRole("link", { name }).click()

    // Verify that the four showing are the salamander, pig, grasshopper, and worm cards
    await Promise.all(
      applications.map(({ application }) =>
        visibleCard(page, application).then(() => console.log("got application", application)),
      ),
    )
  }
})
