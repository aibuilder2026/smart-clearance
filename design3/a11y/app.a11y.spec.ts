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
  { who: 'priya', route: 'batches', stage: 2 },
  { who: 'priya', route: 'report', stage: 9 },
  { who: 'priya', route: 'inbox', stage: 6, run: EXEC },
  { who: 'priya', route: 'profile', stage: 1 },
  { who: 'rakesh', route: 'home', stage: 2, run: [['requestPhoto']] },
  { who: 'rakesh', route: 'photo', stage: 2, run: [['requestPhoto']] },
  { who: 'rakesh', route: 'van', stage: 7 },
  { who: 'rakesh', route: 'orders', stage: 7 },
  { who: 'ganesh', route: 'home', stage: 6, run: EXEC },
  { who: 'ganesh', route: 'offer', stage: 6, run: EXEC },
  { who: 'ganesh', route: 'orders', stage: 7 },
  { who: 'venkat', route: 'market', stage: 6, run: EXEC },
  { who: 'venkat', route: 'listing', stage: 6, run: [...EXEC, ['bid', 13], ['counter']] },
  { who: 'venkat', route: 'bids', stage: 7 },
  { who: 'anita', route: 'paperwork', stage: 8 },
  { who: 'vikram', route: 'report', stage: 9 },
  { who: 'meera', route: 'pickups', stage: 6, run: EXEC },
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
  test(`app · ${s.who} · ${s.route}`, async ({ page }, testInfo) => {
    await signIn(page, s.who, s.route);
    await setWorld(page, s.stage, s.run);
    await report(testInfo, await scan(page, `${s.who} ${s.route}`));
  });
}

test('app · sign-in and its sheets', async ({ page }, testInfo) => {
  await signIn(page, null);
  const findings: Finding[] = [...await scan(page, 'sign-in')];
  await page.getByRole('button', { name: /Explore as someone in the story/ }).click();
  await page.waitForTimeout(700);
  findings.push(...await scan(page, 'sign-in · people sheet'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Continue with phone number/ }).click();
  await page.waitForTimeout(700);
  findings.push(...await scan(page, 'sign-in · phone sheet'));
  await report(testInfo, findings);
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
