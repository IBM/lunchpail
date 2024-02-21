import { expect, Locator, type Page } from "@playwright/test"
import type Kind from "@jaas/common/Kind"

import { visibleCard } from "./card"

export async function verifyDrawerVisible(page: Page, resourceName: string, kind: Kind = "runs") {
  const drawerId = `${kind}.${resourceName}`
  const drawer = await page.locator(
    `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${drawerId}"]`,
  )
  await expect(drawer).toBeVisible()
  return drawer
}

export async function navigateToCard(page: Page, resourceName: string, kind: Kind = "runs", click = true) {
  const card = await visibleCard(page, resourceName)
  console.log(`got ${kind} ${resourceName}`)

  if (click) {
    await card.click()
    return await verifyDrawerVisible(page, resourceName)
  }
}

export default async function navigateToQueues(
  page: Page,
  resourceName: string,
  taskqueue: string,
  kind: Kind = "runs",
) {
  const drawer = await navigateToCard(page, resourceName, kind)
  const queueManagerTab = await drawer.locator(
    `[data-ouia-component-type="PF5/TabButton"][data-ouia-component-id="Tasks"]`,
  )
  await expect(queueManagerTab).toBeVisible()

  await queueManagerTab.click()

  const tasks = await drawer.locator(
    `[data-ouia-component-type="PF5/DescriptionList"][data-ouia-component-id="${taskqueue}"]`,
  )
  await expect(tasks).toBeVisible()
}

export async function navigateToTab(tabLocator: Locator, tabName: string) {
  const tab = await tabLocator.locator(`[data-ouia-component-type="PF5/TabButton"][data-ouia-component-id=${tabName}]`)
  await expect(tab).toBeVisible()
  await tab.click()
}
