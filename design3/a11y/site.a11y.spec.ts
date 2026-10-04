import { test } from '@playwright/test';
import { scan, report, type Finding } from './helpers';

// smartclearance.com, the product's own landing page: every section from the first viewport to the footer, plus the
// sign-in menu, Find your workspace, the phone menu and Book a demo (empty, with its errors, and sent).
const SITE = '/site/Smart-Clearance%20site%20v3.html';
async function open(page) {
  await page.addInitScript(() => { try { localStorage.removeItem('sc3-platform'); } catch (e) { /* storage blocked */ } });
  await page.goto(SITE);
  await page.waitForFunction(() => (window as any).SC3_PLATFORM && document.querySelector('.site .hero'));
  await page.waitForTimeout(900);
}

test('site · the whole page', async ({ page }, testInfo) => {
  await open(page);
  await report(testInfo, await scan(page, 'site'));
});

test('site · sign-in menu, Find your workspace and Book a demo', async ({ page }, testInfo) => {
  await open(page);
  const findings: Finding[] = [];
  const phone = (page.viewportSize()?.width || 1440) < 768;
  await page.locator('.site-nav').getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(400);
  findings.push(...await scan(page, 'site · sign-in menu'));
  await page.keyboard.press('Escape');
  if (phone) {
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.waitForTimeout(600);
    findings.push(...await scan(page, 'site · phone menu'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  await page.locator('.hero').getByRole('button', { name: 'Find your workspace' }).click();
  await page.waitForTimeout(600);
  findings.push(...await scan(page, 'site · Find your workspace'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Talk to us about Growth' }).click();
  await page.waitForTimeout(600);
  findings.push(...await scan(page, 'site · Book a demo'));
  await page.getByRole('button', { name: 'Send request' }).click();
  await page.waitForTimeout(300);
  findings.push(...await scan(page, 'site · Book a demo, errors'));
  await page.getByLabel('Your name').fill('Ritu Malhotra');
  await page.getByLabel('Company').fill('Kesari Foods');
  await page.getByLabel('Work email').fill('ritu@kesari.in');
  await page.getByRole('button', { name: 'Send request' }).click();
  await page.waitForTimeout(400);
  findings.push(...await scan(page, 'site · Book a demo, sent'));
  await report(testInfo, findings);
});
