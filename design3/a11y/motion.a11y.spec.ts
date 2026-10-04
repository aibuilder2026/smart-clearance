import { test, expect } from '@playwright/test';
import { skipSplash } from './helpers';

// WCAG 2.2.2 Pause, Stop, Hide: motion that starts on its own and runs beside other content must stop within five
// seconds or have a control. Every CSS and Web Animations loop here is finite; only loading indicators turn until
// the load ends. This walks the busiest states with motion on and fails on any animation set to repeat forever.
// One desktop run is enough: the motion does not change with theme or width.
test.use({ contextOptions: { reducedMotion: 'no-preference' } });
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-light', 'motion checks run once, on desktop-light');
  await skipSplash(page);
});

const LOADING = '.spinner, .skeleton, .spin';
const endless = page => page.evaluate(loading => document.getAnimations()
  .filter(a => a.effect && a.effect.getTiming().iterations === Infinity)
  .map(a => {
    const fx = a.effect as KeyframeEffect; const el = fx.target as Element | null;
    if (el && el.closest(loading)) return null;
    const name = (a as CSSAnimation).animationName || 'web animation';
    return el ? `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}${fx.pseudoElement || ''} (${name})` : name;
  })
  .filter(Boolean), LOADING);

async function settle(page, url: string, setup?: (page) => Promise<void>) {
  await page.goto(url);
  await page.waitForFunction(() => (window as any).SC3 && document.querySelector('#root')?.childElementCount);
  if (setup) await setup(page);
  await page.waitForTimeout(1500);
}
const signedIn = (uid: string) => async page => {
  await page.evaluate(id => { localStorage.setItem('sc3-session', JSON.stringify({ uid: id, at: 1 })); }, uid);
  await page.reload();
  await page.waitForFunction(() => (window as any).SC3_FLOW && document.querySelector('#root')?.childElementCount);
};
const world = (stage: number, run: [string, unknown?][] = []) => async page => {
  await page.evaluate(([n, steps]) => {
    const F = (window as any).SC3_FLOW; F.Agents.setLive(false); F.fastForward(n);
    for (const [name, arg] of steps as [string, unknown][]) F.run(name, arg);
  }, [stage, run] as const);
};
const APP = '/app/Smart-Clearance%20app%20v3.html';
const CONSOLE = '/console/Smart-Clearance%20console%20v3.html';
const consoleIn = async page => {
  await page.evaluate(() => { localStorage.setItem('sc3-console-session', JSON.stringify({ uid: 'neha', at: 1 })); });
  await page.reload();
  await page.waitForFunction(() => (window as any).SC3_PLATFORM && document.querySelector('#root')?.childElementCount);
};
const EXEC: [string, unknown?][] = [['list'], ['outreach'], ['donate']];
const STATES: [string, string, ((page) => Promise<void>)?][] = [
  ['app · sign-in', APP],
  ['app · Command Center, waiting on approval', APP + '#/command', async p => { await signedIn('priya')(p); await world(5)(p); }],
  ['app · Execution, agents at work', APP + '#/execution', async p => { await signedIn('priya')(p); await world(6, [...EXEC, ['order', 'k0'], ['bid', 13]])(p); }],
  ['app · van route', APP + '#/van', async p => { await signedIn('rakesh')(p); await world(7)(p); }],
  ['app · ExpireSoon market', APP + '#/market', async p => { await signedIn('agrawal')(p); await world(6, EXEC)(p); }],
  ['app · workspace', APP + '#/workspace', async p => { await signedIn('arjun')(p); await world(1)(p); }],
  ['demo · stage 7, live', '/demo/Smart-Clearance%20demo%20v3.html?stage=7#stage=7'],
  ['design system', '/system/Smart-Clearance%20DS%20v3.html'],
  ['console · overview', CONSOLE + '#/overview', consoleIn],
  ['console · Munchly agents', CONSOLE + '#/clients/munchly/agents', consoleIn],
];

for (const [name, url, setup] of STATES) {
  test(`motion · nothing loops forever · ${name}`, async ({ page }) => {
    await settle(page, url, setup);
    expect(await endless(page), 'animations set to repeat forever').toEqual([]);
  });
}
