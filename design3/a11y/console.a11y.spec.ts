import { expect, test } from '@playwright/test';
import { scan, report, type Finding } from './helpers';

// The console at console.smartclearance.com: the staff sign-in and every screen, seeded with Munchly Foods,
// plus the states a super admin opens most: an agent's settings and the new-client steps.
const CONSOLE = '/console/Smart-Clearance%20console%20v3.html';

async function open(page, route: string | null, query = '') {
  await page.addInitScript(([signed]) => {
    try {
      if (!sessionStorage.getItem('sc3-a11y-console')) { localStorage.removeItem('sc3-platform'); sessionStorage.setItem('sc3-a11y-console', '1'); }
      if (signed) localStorage.setItem('sc3-console-session', JSON.stringify({ uid: 'neha', at: 1 }));
      else localStorage.removeItem('sc3-console-session');
    } catch (e) { /* storage blocked */ }
  }, [route !== null]);
  await page.goto(CONSOLE + query + (route ? '#/' + route : ''));
  await page.waitForFunction(() => (window as any).SC3_PLATFORM && document.querySelector('#root')?.childElementCount);
  // the splash covers the first load (SC-51), then each screen is read (SC-49): wait for the splash to lift, for the
  // placeholders to give way, and for the content to rise into place
  await page.waitForFunction(() => !document.querySelector('.cs-splash'), null, { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.cs-load'));
  await page.waitForTimeout(900);
}

const ROUTES = ['overview', 'clients', 'clients/munchly/agents', 'clients/munchly/supply', 'clients/munchly/rules', 'clients/munchly/people',
  'clients/munchly/integrations', 'clients/munchly/plan', 'clients/munchly/audit', 'agents', 'connectors', 'plans', 'staff', 'audit'];
for (const r of ROUTES) {
  test(`console · ${r}`, async ({ page }, testInfo) => {
    await open(page, r);
    await report(testInfo, await scan(page, `console ${r}`));
  });
}

test('console · sign-in, a wrong sign-in, and Find a workspace', async ({ page }, testInfo) => {
  await open(page, null);
  const findings: Finding[] = [...await scan(page, 'console sign-in')];
  await page.getByLabel('Work email').fill('nobody@smartclearance.com');
  await page.getByLabel('Password', { exact: true }).fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('alert').waitFor();
  findings.push(...await scan(page, 'console sign-in · a wrong sign-in'));
  await page.getByRole('button', { name: 'Find a workspace' }).click();
  await page.getByLabel('Email or mobile number').fill('priya.deshmukh@munchly.in');
  await page.getByRole('button', { name: 'Find workspaces' }).click();
  await page.waitForTimeout(700);
  findings.push(...await scan(page, 'console sign-in · Find your workspace'));
  await report(testInfo, findings);
});

test('console · an agent, and a new client step by step', async ({ page }, testInfo) => {
  await open(page, 'clients/munchly/agents');
  const findings: Finding[] = [];
  // the inspector sits beside the pipeline on desktop and opens as a sheet on tablets and phones
  await page.getByRole('button', { name: /^Negotiator/ }).first().click();
  await page.waitForTimeout(800);
  findings.push(...await scan(page, 'console · Negotiator settings'));
  await page.keyboard.press('Escape');
  await page.goto(CONSOLE + '#/new-client');
  await page.waitForTimeout(800);
  const next = async () => { await page.getByRole('button', { name: 'Continue' }).click(); await page.waitForTimeout(500); };
  await page.getByLabel('Company name').fill('Kesari Foods');
  await page.getByLabel('Home city').fill('Indore');
  findings.push(...await scan(page, 'new client · company'));
  await next();
  await page.getByLabel('Staff email domain').fill('kesari.in');
  await next();
  await page.getByRole('radio', { name: 'The manufacturer' }).check();
  findings.push(...await scan(page, 'new client · supply chain'));
  await next(); await next();
  findings.push(...await scan(page, 'new client · agents'));
  await next();
  await page.getByLabel("Workspace admin's name").fill('Ritu Malhotra');
  await page.getByLabel("Admin's work email").fill('ritu@kesari.in');
  await next();
  findings.push(...await scan(page, 'new client · review'));
  await report(testInfo, findings);
});

// SC-47: an SKU's own quick-commerce gates, and a batch's override, in the SKU sheet
test('console · an SKU\'s gates and a batch override', async ({ page }, testInfo) => {
  await open(page, 'clients/munchly/supply');
  const findings: Finding[] = [];
  // desktops open the SKU from its name in the table; phones from its row in the list
  const sku = page.getByRole('button', { name: /^Choco Cream Biscuits 200 g/ }).first();
  await sku.scrollIntoViewIfNeeded();
  await sku.click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(600);
  findings.push(...await scan(page, 'console · an SKU on the default, with an overridden batch'));
  await page.getByRole('button', { name: 'Change' }).click();
  await page.waitForTimeout(300);
  findings.push(...await scan(page, 'console · changing a batch override'));
  await page.getByRole('button', { name: 'Its own' }).click();
  await page.getByLabel('Blinkit takes at least', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Save gates' }).click();
  await page.getByRole('alert').first().waitFor();
  findings.push(...await scan(page, 'console · an SKU with its own gates, out of bounds'));
  await report(testInfo, findings);
});

// SC-49: Sign in keeps its label while it checks, then welcomes; a tab loads under the route, over its placeholders
test('console · Sign in while it checks, and a tab loading', async ({ page }, testInfo) => {
  await open(page, null, '?read=4000');
  await page.getByLabel('Work email').fill('neha.kulkarni@smartclearance.com');
  await page.getByLabel('Password', { exact: true }).fill('anything');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.cs-si-btn')).toContainText('Signing in…');
  const findings: Finding[] = [...await scan(page, 'console sign-in · signing in')];
  await page.locator('.cs-si-btn', { hasText: 'Welcome, Neha' }).waitFor({ state: 'attached' });
  // the splash takes over from the welcome (SC-51): the page behind it is inert until it opens onto the Overview
  await page.locator('.cs-splash.enter.in').waitFor({ state: 'attached', timeout: 8000 });
  findings.push(...await scan(page, 'console · the splash, signing in'));
  await page.waitForFunction(() => !document.querySelector('.cs-splash'), null, { timeout: 15000 });
  await expect(page.getByRole('status').filter({ hasText: 'Loading Overview' })).toBeAttached();
  findings.push(...await scan(page, 'console · the Overview loading'));
  await page.getByRole('heading', { level: 1, name: 'Overview' }).waitFor({ timeout: 8000 });
  await page.evaluate(() => { location.hash = '#/clients/munchly/agents'; });
  await page.getByRole('tab', { name: 'Supply chain' }).click({ timeout: 8000 });
  await expect(page.getByRole('status').filter({ hasText: 'Loading the tab' })).toBeAttached();
  findings.push(...await scan(page, 'console · a tab loading'));
  await report(testInfo, findings);
});

// SC-48: the Overview as a live dashboard: a stop chosen, the chart as a table, the closed batches, updates paused
test('console · the Overview dashboard, its table and its filters', async ({ page }, testInfo) => {
  await open(page, 'overview');
  const findings: Finding[] = [];
  await page.getByRole('button', { name: /^Detect: 7 batches/ }).click();
  await page.waitForTimeout(300);
  findings.push(...await scan(page, 'console · Overview, a stop chosen'));
  await page.getByRole('button', { name: 'Show as a table' }).click();
  await page.getByRole('button', { name: 'Pause updates' }).click();
  await page.waitForTimeout(300);
  findings.push(...await scan(page, 'console · Overview, the chart as a table, updates paused'));
  await page.getByRole('button', { name: /^Closed \d/ }).click();
  await page.waitForTimeout(300);
  findings.push(...await scan(page, 'console · Overview, no closed batches'));
  await report(testInfo, findings);
});
