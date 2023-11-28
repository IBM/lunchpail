import { expect, type Page } from "@playwright/test"

export async function verifyDrawerVisible(page: Page, application: string) {
  const drawerId = "applications." + application
  const drawer = await page.locator(
    `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${drawerId}"]`,
  )
  await expect(drawer).toBeVisible()
  return drawer
}

export async function navigateToCard(page: Page, application: string) {
  const appCardSelector = [`[data-ouia-component-type="PF5/Card"][data-ouia-component-id="${application}"]`].join(" ")
  const appCard = page.locator(appCardSelector)

  await expect(appCard)
    .toBeVisible({
      timeout: 60000,
    })
    .then(() => console.log("got application for taskqueue", application))

  await appCard.click()
  return await verifyDrawerVisible(page, application)
}

export default async function navigateToQueues(page: Page, application: string, taskqueue: string) {
  const drawer = await navigateToCard(page, application)
  const queueManagerTab = await drawer.locator(
    `[data-ouia-component-type="PF5/TabButton"][data-ouia-component-id="Status"]`,
  )
  await expect(queueManagerTab).toBeVisible({ timeout: 60000 })

  await queueManagerTab.click()

  const tasks = await drawer.locator(
    `[data-ouia-component-type="PF5/DescriptionList"][data-ouia-component-id="${taskqueue}"]`,
  )
  await expect(tasks).toBeVisible({ timeout: 60000 })
}
