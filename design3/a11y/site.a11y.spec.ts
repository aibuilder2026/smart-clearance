import { test, expect } from '@playwright/test';
import { scan, report, type Finding } from './helpers';

// smartclearance.com, the product's own landing page: every section from the first viewport to the footer, the town in
// the first viewport with a place and an agent opened and with its tour paused at an agent's card, plus the sign-in
// menu, Find your workspace, the phone menu and Book a demo (empty, with its errors, and sent).
const SITE = '/site/Smart-Clearance%20site%20v3.html';
async function open(page) {
  await page.addInitScript(() => { try { localStorage.removeItem('sc3-platform'); } catch (e) { /* storage blocked */ } });
  await page.goto(SITE);
  await page.waitForFunction(() => (window as any).SC3_PLATFORM && document.querySelector('.site .hero'));
  // the loader (SC-35) lifts once the town is drawn; the page is scanned as the visitor then sees it
  await page.waitForFunction(() => (window as any).SC3_LOADER?.lifted, null, { timeout: 15000 });
  await page.waitForTimeout(900);
}

test('site · the whole page', async ({ page }, testInfo) => {
  await open(page);
  await report(testInfo, await scan(page, 'site'));
});

test('site · the town: a place, then an agent, opened', async ({ page }, testInfo) => {
  await open(page);
  const findings: Finding[] = [];
  // on desktops a click (SC-42) keeps the card beside the pin, and a chip in it moves the card on to what it names;
  // a tap opens the panel, as the keyboard does
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await page.locator('.hero').getByRole('button', { name: 'Distributor · stockist: what happens here' }).click();
    await page.waitForTimeout(900);
    findings.push(...await scan(page, 'site · the town, the godown kept'));
    await page.locator('.town-peek').getByRole('button', { name: 'Watcher' }).click();
    await page.waitForTimeout(900);
    findings.push(...await scan(page, 'site · the town, the Watcher kept'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  // the keyboard opens the panel, on every screen
  await page.locator('.hero').getByRole('button', { name: 'Distributor · stockist: what happens here' }).focus();
  await page.keyboard.press('Enter');
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

// the loader (SC-35): while the page loads it says so once, the page under it is busy, and it lifts once the town is in;
// a change of theme plays under it and focus stays where the visitor left it
test('site · the loader, on a load and on a change of theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-light' && testInfo.project.name !== 'phone-dark', 'the loader is checked once in each theme');
  // the town's plate held back, so the loader is still up to be scanned
  let release: () => void = () => {};
  const held = new Promise<void>(r => { release = r; });
  await page.route(/\/business(-night)?\.webp$/, async route => { await held; await route.continue(); });
  await page.goto(SITE, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.loader [role="status"]')).toHaveText('Loading Smart-Clearance');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(1);
  const findings: Finding[] = await scan(page, 'site · the loader, on a load');
  release();
  await page.waitForFunction(() => (window as any).SC3_LOADER?.lifted, null, { timeout: 15000 });
  await expect(page.locator('.loader')).toHaveCount(0);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);

  // Dark or Light chosen from the keyboard: the page turns under the loader, and focus is back on Appearance
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  const to = before === 'dark' ? 'Light' : 'Dark';
  await page.getByRole('button', { name: 'Appearance' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitemradio', { name: to }).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !(window as any).SC3_LOADER?.busy, null, { timeout: 15000 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', to.toLowerCase());
  await expect(page.locator('.loader')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Appearance' })).toBeFocused();
  findings.push(...await scan(page, 'site · after a change of theme'));
  await report(testInfo, findings);
});
