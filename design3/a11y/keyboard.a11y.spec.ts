import { test, expect } from '@playwright/test';
import { skipSplash } from './helpers';

// Keyboard behaviour axe-core cannot see: tab order on sign-in, and a sheet taking focus on open,
// keeping it while open, and handing it back on close (WCAG 2.1.2, 2.4.3; ARIA dialog pattern).
// One desktop run is enough: the behaviour does not change with theme.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-light', 'keyboard checks run once, on desktop-light');
  await skipSplash(page);
  await page.addInitScript(() => { try { localStorage.removeItem('sc3-session'); } catch (e) { /* blocked */ } });
  await page.goto('/app/Smart-Clearance%20app%20v3.html');
  await page.waitForSelector('.signin');
  await page.waitForTimeout(800);
});

const focusedName = page => page.evaluate(() => {
  const el = document.activeElement as HTMLElement | null;
  return el ? (el.getAttribute('aria-label') || el.innerText || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 60) : '';
});

test('keyboard · sign-in options follow the visual order', async ({ page }) => {
  const seen: string[] = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); seen.push(await focusedName(page)); }
  expect(seen.join(' | ')).toMatch(/Continue with Google.*Continue with phone number.*Sign in with ExpireSoon.*Explore as someone in the story/);
});

test('keyboard · a sheet takes focus, keeps it, and gives it back', async ({ page }) => {
  const trigger = page.getByRole('button', { name: /Explore as someone in the story/ });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const inDialog = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  expect.soft(await inDialog(), 'focus moves into the sheet when it opens').toBe(true);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  expect.soft(await inDialog(), 'Tab stays inside the open sheet').toBe(true);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  expect.soft(await page.locator('[role="dialog"]').count(), 'Escape closes the sheet').toBe(0);
  expect.soft(await focusedName(page), 'focus returns to the button that opened the sheet').toMatch(/Explore as someone/);
});
