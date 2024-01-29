// @ts-check
import { expect, test } from "@playwright/test"
import { demoModeOff, hackInit } from "./demoModeOff"

test("jaas compute target is visible", async () => {
  // Make sure demo mode is off
  const { page } = await demoModeOff()

  // Call hack/init.sh
  const stdout = await hackInit()
  console.log(stdout)

  // Navigate to 'Places' tab
  const placesTab = await page.locator('[data-ouia-component-type="PF5/NavItem"]', { hasText: "Places" })
  await expect(placesTab).toBeVisible()
  await placesTab.click()

  // Verify that we are viewing the 'Places' section
  const placesSection = await page.locator('[data-ouia-component-type="PF5/Card"]', { hasText: "Places" })
  await expect(placesSection).toBeVisible()

  // Look for Jaas compute target
  const jaasComputeTarget = await page.locator(
    '[data-ouia-component-type="PF5/Card"][data-ouia-component-id="kind-jaas"]',
  )
  await expect(jaasComputeTarget).toBeVisible()
})
