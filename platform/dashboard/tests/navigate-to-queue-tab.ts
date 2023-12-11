import { expect, Locator, type Page } from "@playwright/test"

import { visibleCard } from "./card"

export async function verifyDrawerVisible(page: Page, application: string) {
  const drawerId = "applications." + application
  const drawer = await page.locator(
    `[data-ouia-component-type="PF5/DrawerPanelContent"][data-ouia-component-id="${drawerId}"]`,
  )
  await expect(drawer).toBeVisible()
  return drawer
}

export async function navigateToCard(page: Page, application: string) {
  const appCard = await visibleCard(page, application)
  console.log("got application for taskqueue", application)

  await appCard.click()
  return await verifyDrawerVisible(page, application)
}

export default async function navigateToQueues(page: Page, application: string, taskqueue: string) {
  const drawer = await navigateToCard(page, application)
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
