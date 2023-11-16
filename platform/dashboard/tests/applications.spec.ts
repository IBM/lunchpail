// @ts-check
import { expect, test } from "@playwright/test"
import launchElectron from "./launch-electron"

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
    await page.getByRole("link", { name: "Definitions" }).click()

    // Verify that the four showing are the salamander, pig, grasshopper, and worm cards
    const expectedCards = ["salamander", "pig", "grasshopper", "worm"]

    await Promise.all(
      expectedCards.map((id) =>
        expect(page.locator(`[data-ouia-component-type="PF5/Card"][data-ouia-component-id="${id}"]`))
          .toBeVisible({
            timeout: 60000,
          })
          .then(() => console.log("got application", id)),
      ),
    )
  }
})
