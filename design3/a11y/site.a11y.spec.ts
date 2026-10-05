import { test } from '@playwright/test';
import { scan, report, type Finding } from './helpers';

// smartclearance.com, the product's own landing page: every section from the first viewport to the footer, the town in
// the first viewport with a place and an agent opened and with its tour paused at an agent's card, plus the sign-in
// menu, Find your workspace, the phone menu and Book a demo (empty, with its errors, and sent).
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

test('site · the town: a place, then an agent, opened', async ({ page }, testInfo) => {
  await open(page);
  const findings: Finding[] = [];
  await page.locator('.hero').getByRole('button', { name: 'Distributor · stockist: what happens here' }).click();
  await page.waitForTimeout(900);
  findings.push(...await scan(page, 'site · the town, the godown opened'));
  await page.locator('.town-panel').getByRole('button', { name: 'Watcher' }).click();
  await page.waitForTimeout(900);
  findings.push(...await scan(page, 'site · the town, the Watcher opened'));
  await report(testInfo, findings);
});

// the tour plays only with motion on; it is paused at a card before the scan, so every colour is at rest
test.describe('the town\'s tour, with motion on', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('site · the town\'s tour: a card beside the agent at work, paused', async ({ page }, testInfo) => {
    await open(page);
    await page.waitForFunction(() => !!document.querySelector('.town-tip b'), null, { timeout: 15000 });
    await page.locator('.town-ctl').getByRole('button', { name: 'Pause' }).click();
    await page.waitForTimeout(400);
    await report(testInfo, await scan(page, 'site · the town\'s tour, paused at a card'));
  });
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
