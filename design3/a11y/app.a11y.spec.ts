import { test } from '@playwright/test';
import { scan, report, skipSplash, type Finding } from './helpers';

// The app: every role's screens, each in a journey state where it carries real content.
// stage = the journey stage the world is fast-forwarded to (0 Connect … 8 Report, 9 cleared);
// run = extra journey actions applied on top, in order.
type Scenario = { who: string; route: string; stage: number; run?: [string, unknown?][] };
const EXEC: [string, unknown?][] = [['list'], ['outreach'], ['donate']];
const SCENARIOS: Scenario[] = [
  { who: 'priya', route: 'setup', stage: 0 },
  { who: 'priya', route: 'command', stage: 5 },
  { who: 'priya', route: 'route', stage: 5 },
  { who: 'priya', route: 'execution', stage: 6, run: [...EXEC, ['order', 'k0'], ['order', 'k1'], ['bid', 13], ['counter']] },
  { who: 'priya', route: 'execution', stage: 8 },
  { who: 'priya', route: 'batches', stage: 2 },
  { who: 'priya', route: 'report', stage: 9 },
  { who: 'priya', route: 'inbox', stage: 6, run: EXEC },
  { who: 'priya', route: 'profile', stage: 1 },
  { who: 'rakesh', route: 'home', stage: 0 },
  { who: 'rakesh', route: 'home', stage: 2, run: [['requestPhoto']] },
  { who: 'rakesh', route: 'home', stage: 8 },
  { who: 'rakesh', route: 'photo', stage: 2, run: [['requestPhoto']] },
  { who: 'rakesh', route: 'van', stage: 8 },
  { who: 'rakesh', route: 'orders', stage: 7 },
  { who: 'ganesh', route: 'home', stage: 6, run: EXEC },
  { who: 'ganesh', route: 'offer', stage: 6, run: EXEC },
  { who: 'ganesh', route: 'orders', stage: 7 },
  { who: 'agrawal', route: 'market', stage: 6, run: EXEC },
  { who: 'agrawal', route: 'listing', stage: 6, run: [...EXEC, ['bid', 13], ['counter']] },
  { who: 'agrawal', route: 'listing', stage: 7 },
  { who: 'agrawal', route: 'bids', stage: 7 },
  { who: 'anita', route: 'paperwork', stage: 8 },
  { who: 'vikram', route: 'report', stage: 9 },
  { who: 'meera', route: 'pickups', stage: 6, run: EXEC },
  { who: 'arjun', route: 'workspace', stage: 1 },
  { who: 'arjun', route: 'users', stage: 1 },
  { who: 'arjun', route: 'rules', stage: 1 },
  { who: 'arjun', route: 'integrations', stage: 1 },
  { who: 'arjun', route: 'audit', stage: 9 },
];
const APP = '/app/Smart-Clearance%20app%20v3.html';

async function signIn(page, who: string | null, route?: string) {
  await skipSplash(page);
  await page.addInitScript(([uid]) => {
    try {
      if (!sessionStorage.getItem('sc3-a11y-seeded')) { localStorage.clear(); sessionStorage.setItem('sc3-a11y-seeded', '1'); }
      if (uid) localStorage.setItem('sc3-session', JSON.stringify({ uid, at: 1 })); else localStorage.removeItem('sc3-session');
    } catch (e) { /* storage blocked */ }
  }, [who]);
  await page.goto(APP + (route ? `#/${route}` : ''));
  await page.waitForFunction(() => (window as any).SC3_FLOW && document.querySelector('#root')?.childElementCount);
  await page.waitForTimeout(600);
}

async function setWorld(page, stage: number, run: [string, unknown?][] = []) {
  await page.evaluate(([n, steps]) => {
    const F = (window as any).SC3_FLOW;
    F.Agents.setLive(false); // hold the world still while it is scanned
    F.fastForward(n);
    for (const [name, arg] of steps as [string, unknown][]) F.run(name, arg);
  }, [stage, run] as const);
  await page.waitForTimeout(1200);
}

for (const s of SCENARIOS) {
  test(`app · ${s.who} · ${s.route} · stage ${s.stage}`, async ({ page }, testInfo) => {
    await signIn(page, s.who, s.route);
    await setWorld(page, s.stage, s.run);
    await report(testInfo, await scan(page, `${s.who} ${s.route} at stage ${s.stage}`));
  });
}

test('app · sign-in and its sheets', async ({ page }, testInfo) => {
  await signIn(page, null);
  const findings: Finding[] = [...await scan(page, 'sign-in')];
  const id = page.getByLabel('Work email or mobile number');
  const close = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(500); };
  // a mobile number gets a one-time code
  await id.fill('98230 44118');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForTimeout(1100);
  findings.push(...await scan(page, 'sign-in · code sheet'));
  await close();
  // a munchly.in address goes to Google Workspace
  await id.fill('priya.deshmukh@munchly.in');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForTimeout(1000);
  findings.push(...await scan(page, 'sign-in · Google sheet'));
  await close();
  // anyone else is told so, and offered the way to their own workspace
  await id.fill('someone@elsewhere.in');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForTimeout(500);
  findings.push(...await scan(page, 'sign-in · not in this workspace'));
  await page.getByRole('button', { name: 'Find your workspace' }).first().click();
  await page.waitForTimeout(700);
  findings.push(...await scan(page, 'sign-in · find your workspace'));
  await close();
  // an invited number joins the workspace on first sign-in
  await id.fill('98230 60013');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForTimeout(1100);
  await page.locator('.otp input').first().fill('2');
  await page.keyboard.type('46810');
  await page.waitForTimeout(1300);
  findings.push(...await scan(page, 'sign-in · join the workspace'));
  await close();
  await page.getByRole('button', { name: /Explore as someone in the story/ }).click();
  await page.waitForTimeout(700);
  findings.push(...await scan(page, 'sign-in · people sheet'));
  await report(testInfo, findings);
});

test('app · the workspace sheet', async ({ page }, testInfo) => {
  await signIn(page, 'rakesh', 'home');
  await setWorld(page, 1);
  await page.getByRole('button', { name: /Munchly Foods workspace/ }).first().click();
  await page.waitForTimeout(800);
  await report(testInfo, await scan(page, 'workspace sheet'));
});

test('app · approve sheet and plan placed', async ({ page }, testInfo) => {
  await signIn(page, 'priya', 'route');
  await setWorld(page, 5);
  await page.getByRole('button', { name: /Review and approve/ }).first().click();
  await page.waitForTimeout(800);
  const findings: Finding[] = [...await scan(page, 'approve sheet')];
  await page.getByRole('button', { name: /Approve · release the agents/ }).click();
  await page.waitForTimeout(1600);
  findings.push(...await scan(page, 'plan placed'));
  await report(testInfo, findings);
});
