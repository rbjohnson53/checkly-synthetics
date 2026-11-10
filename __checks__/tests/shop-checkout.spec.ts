import { test, expect } from '@playwright/test'

// automationexercise.com is a public practice shop that shows Google ads,
// including full-screen "vignette" ads that cover the page and break clicks.
// Blocking the ad networks keeps the check about the shop, not the ads.
const AD_HOSTS = /googlesyndication\.com|doubleclick\.net|googleadservices\.com|adservice\.google\.com|google-analytics\.com|googletagmanager\.com/

test('Shop: add Blue Top to cart and reach signup at checkout', async ({ page }) => {
  await page.route(AD_HOSTS, (route) => route.abort())

  // The cookie consent banner only shows in some regions (e.g. Checkly's EU locations)
  // and appears a moment after load. This handler clicks it whenever it shows up,
  // instead of checking once with isVisible() before it has rendered.
  await page.addLocatorHandler(page.getByRole('button', { name: 'Consent' }), async (button) => {
    await button.click()
  })

  await page.goto('https://www.automationexercise.com/')

  // The link text starts with an icon-font character; match on the visible word instead.
  await page.getByRole('link', { name: 'Products' }).click()
  await expect(page.getByPlaceholder('Search Product')).toBeVisible()

  // "Blue Top" has two Add to cart buttons with the same selector on this page.
  // Scope to the product card that contains the name, then take its first button.
  const blueTopCard = page.locator('.productinfo').filter({ hasText: 'Blue Top' }).first()

  // "Add to cart" and "Proceed To Checkout" open pop-ups via the site's JavaScript.
  // A click that lands before that script is ready does nothing (~30% of local runs failed here).
  // So: click, and retry the click until the pop-up actually appears.
  await expect(async () => {
    await blueTopCard.getByText('Add to cart').click()
    await expect(page.getByRole('heading', { name: 'Added!' })).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 20_000 })

  await page.getByRole('button', { name: 'Continue Shopping' }).click()
  await page.getByRole('link', { name: 'Cart' }).click()
  await expect(page.getByRole('cell', { name: 'Blue Top' })).toBeVisible()

  const registerLink = page.getByRole('link', { name: 'Register / Login' })
  await expect(async () => {
    await page.getByText('Proceed To Checkout').click()
    await expect(registerLink).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 20_000 })
  await registerLink.click()
  await expect(page.getByRole('heading', { name: 'New User Signup!' })).toBeVisible()
})
