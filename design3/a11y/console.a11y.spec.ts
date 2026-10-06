import { test } from '@playwright/test';
import { scan, report, type Finding } from './helpers';

// The console at console.smartclearance.com: the staff sign-in and every screen, seeded with Munchly Foods,
// plus the states a super admin opens most: an agent's settings and the new-client steps.
const CONSOLE = '/console/Smart-Clearance%20console%20v3.html';

async function open(page, route: string | null) {
  await page.addInitScript(([signed]) => {
    try {
      if (!sessionStorage.getItem('sc3-a11y-console')) { localStorage.removeItem('sc3-platform'); sessionStorage.setItem('sc3-a11y-console', '1'); }
      if (signed) localStorage.setItem('sc3-console-session', JSON.stringify({ uid: 'neha', at: 1 }));
      else localStorage.removeItem('sc3-console-session');
    } catch (e) { /* storage blocked */ }
  }, [route !== null]);
  await page.goto(CONSOLE + (route ? '#/' + route : ''));
  await page.waitForFunction(() => (window as any).SC3_PLATFORM && document.querySelector('#root')?.childElementCount);
  await page.waitForTimeout(700);
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
