// @ts-check
import { expect, test } from "@playwright/test"
import { demoModeOff } from "./demoModeOff"

test("jaas compute target is visible", async () => {
  // Temporary fix for test timing out before hackInit() completes (described in issue below)
  // https://github.ibm.com/cloud-computer/jaas/issues/1057
  // Let's try doubling the test timeout for now.
  test.setTimeout(240000)

  // Make sure demo mode is off
  const { page } = await demoModeOff()

  // Navigate to 'Places' tab
  const placesTab = await page.locator(
    '[data-ouia-component-type="PF5/NavItem"][data-ouia-component-id="computetargets.Places"]',
  )
  await expect(placesTab).toBeVisible()
  await placesTab.click()

  // Verify that we are viewing the 'Places' section
  const placesSection = await page.locator('[data-ouia-component-type="PF5/Card"][data-ouia-component-id="Places"]')
  await expect(placesSection).toBeVisible()

  // Look for Jaas compute target
  const jaasComputeTarget = await page.locator(
    '[data-ouia-component-type="PF5/Card"][data-ouia-component-id="kind-jaas"]',
  )
  await expect(jaasComputeTarget).toBeVisible()
})
