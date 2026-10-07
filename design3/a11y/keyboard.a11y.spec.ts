import { test, expect } from '@playwright/test';
import { scan, report, skipSplash, type Finding } from './helpers';

// Behaviour axe-core cannot see:
// - tab order on sign-in;
// - a sheet taking focus on open, keeping it while open, and handing it back on close (WCAG 2.1.2, 2.4.3; ARIA dialog);
// - a menu button's menu: focus in on open, the arrows, Home and End, Escape and Tab out (ARIA menu button);
// - the sign-in hero plays once and holds, and can be paused and replayed (WCAG 2.2.2);
// - the landing page's table: its tour pauses, plays and replays (WCAG 2.2.2).
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
  const label = el && (el as HTMLInputElement).labels && (el as HTMLInputElement).labels![0];
  return el ? (el.getAttribute('aria-label') || (label && label.innerText) || el.innerText || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 60) : '';
});

test('keyboard · sign-in options follow the visual order', async ({ page }) => {
  const seen: string[] = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); seen.push(await focusedName(page)); }
  expect(seen.join(' | ')).toMatch(/Work email or mobile number.*Continue.*Priya.*Explore as someone in the story.*Find yours/);
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

test('keyboard · a menu opens on its button, moves with the arrows, and gives focus back', async ({ page }, testInfo) => {
  await page.addInitScript(() => { try { localStorage.setItem('sc3-session', JSON.stringify({ uid: 'priya', at: 1 })); } catch (e) { /* blocked */ } });
  await page.reload(); // signed in as Priya, on her Command Center
  await page.waitForSelector('.signin', { state: 'detached' });
  const trigger = page.getByRole('button', { name: 'Appearance' });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  const menu = page.getByRole('menu', { name: 'Appearance' });
  const item = (name: string) => menu.getByRole('menuitemradio', { name });

  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.locator('[aria-checked="true"]'), 'focus lands on the checked choice').toBeFocused();
  await page.keyboard.press('Home');
  await expect(item('Light')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item('Dark')).toBeFocused();
  await page.keyboard.press('End');
  await expect(item('Match device')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item('Light'), 'ArrowDown wraps to the first item').toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(item('Match device'), 'ArrowUp wraps to the last item').toBeFocused();
  const findings: Finding[] = await scan(page, 'appearance menu open');

  await page.keyboard.press('Escape');
  await expect(menu, 'Escape closes the menu').toHaveCount(0);
  await expect(trigger, 'focus returns to the menu button').toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await page.keyboard.press('Enter');
  await expect(menu.locator('[aria-checked="true"]')).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await expect(item('Dark')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu, 'choosing an item closes the menu').toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('.app').first(), 'the choice is applied').toHaveAttribute('data-theme', 'dark');

  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(menu, 'Tab closes the menu and moves on').toHaveCount(0);
  await report(testInfo, findings);
});

test.describe('the sign-in hero, with motion on', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('keyboard · the sign-in hero plays once, pauses and replays (WCAG 2.2.2)', async ({ page }, testInfo) => {
    const done = () => page.locator('.si-track .stop.done').count();
    const pause = page.getByRole('button', { name: 'Pause animation' });
    await expect(pause).toBeVisible();
    const before = await done();
    await expect.poll(done, { message: 'the hero moves while it plays', timeout: 4000 }).not.toBe(before);

    await pause.focus();
    await page.keyboard.press('Enter');
    const play = page.getByRole('button', { name: 'Play animation' });
    await expect(play).toBeFocused();
    const held = await done();
    await page.waitForTimeout(2500);
    expect.soft(await done(), 'the tracker holds while paused').toBe(held);
    expect.soft(await page.locator('.si-renders img').first().evaluate(el => getComputedStyle(el).animationPlayState), 'the floating renders hold too').toBe('paused');
    const findings: Finding[] = await scan(page, 'sign-in hero paused');

    await page.reload();
    await page.waitForSelector('.signin');
    const replay = page.getByRole('button', { name: 'Replay animation' });
    await expect(replay, 'a paused hero stays paused on return, on its final frame').toBeVisible();

    await replay.click();
    await expect(pause).toBeVisible();
    const restarted = await done();
    await expect.poll(done, { message: 'Replay walks the stages again', timeout: 4000 }).not.toBe(restarted);
    await expect(replay, 'the walk ends on its own').toBeVisible({ timeout: 12000 });
    const final = await done();
    await page.waitForTimeout(2000);
    expect.soft(await done(), 'and holds on the result instead of looping').toBe(final);
    await report(testInfo, findings);
  });
});

// The landing page's table (SC-60): the agents work the batch one in focus at a time; Pause holds the card and Play
// carries the tour on, from the keyboard; a step chosen in the rail jumps and holds; Replay runs it again.
test.describe('the landing page\'s table, with motion on', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('keyboard · the table\'s tour pauses and plays, a step in the rail jumps and holds, and Replay runs it again', async ({ page }, testInfo) => {
    await page.goto('/site/Smart-Clearance%20site%20v3.html');
    await page.waitForFunction(() => (window as any).SC3_LOADER?.lifted, null, { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.tb-stage')!.scrollIntoView());
    const step = () => page.evaluate(() => document.querySelector('.tb-focus .n')?.textContent || '');
    await expect.poll(step, { message: 'a card opens as the tour reaches each agent', timeout: 5000 }).not.toBe('');
    const ctl = page.locator('.tb-ctl');
    await ctl.getByRole('button', { name: 'Pause' }).focus();
    await page.keyboard.press('Enter');
    await expect(ctl.getByRole('button', { name: 'Play' }), 'one button, so focus stays on it').toBeFocused();
    const held = await step();
    await page.waitForTimeout(2600);
    expect.soft(await step(), 'the tour holds while paused').toBe(held);
    const findings: Finding[] = await scan(page, 'site · the table\'s tour, paused');
    await page.keyboard.press('Enter');
    await expect(ctl.getByRole('button', { name: 'Pause' })).toBeFocused();
    await expect.poll(step, { message: 'Play carries the tour on', timeout: 4000 }).not.toBe(held);

    await page.locator('.tb-focus .rail').getByRole('button', { name: 'Negotiator' }).click();
    await expect(page.locator('.tb-focus h3')).toHaveText('Negotiator');
    await expect(ctl.getByRole('button', { name: 'Play' }), 'a step chosen by hand holds the tour').toBeVisible();
    await ctl.getByRole('button', { name: 'Play' }).click();
    const replay = page.locator('.tb-result').getByRole('button', { name: 'Replay' });
    await expect(replay).toBeVisible({ timeout: 8000 });
    await replay.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.tb-focus .n')).toHaveText('1 of 11', { timeout: 2000 });
    await report(testInfo, findings);
  });
});
});
