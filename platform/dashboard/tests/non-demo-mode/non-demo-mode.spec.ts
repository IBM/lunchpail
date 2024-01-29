// @ts-check
import { expect, test } from "@playwright/test"
import { demoModeOff } from "./demoModeOff"

test("demo mode off persists reload", async () => {
  // Make sure demo mode is off
  const { page, demoSwitch } = await demoModeOff()

  // Reload dashboard
  await page.reload()

  // Get demo mode state and verify that demo mode is off
  const state2 = await demoSwitch.isChecked()
  await expect(state2).toEqual(false)
})
