import { type Page, expect } from "@playwright/test"

function card(page: Page, id: string) {
  return page.locator(`[data-ouia-component-type="PF5/Card"][data-ouia-component-id="${id}"]`)
}

export async function missingCard(page: Page, id: string) {
  return expect(await card(page, id)).toHaveCount(0)
}

export async function visibleCard(page: Page, id: string) {
  const c = await card(page, id)
  await expect(c).toBeVisible()
  return c
}

export function clickOnCard(page: Page, id: string) {
  return visibleCard(page, id).then((_) => _.click())
}
