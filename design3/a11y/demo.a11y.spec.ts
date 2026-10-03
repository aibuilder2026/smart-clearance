import { test, expect } from '@playwright/test';
import { scan as scanPage, report, skipSplash, type Finding } from './helpers';

// The laptop and phone previews are drawn scaled down, so their buttons measure under 24 px; the app spec
// checks those same screens at full size, so the previews are left out of the target-size rule here.
const scan = (page, state: string) => scanPage(page, state, { targetSizeExclude: ['.dev-ring'] });

// The guided demo, stage by stage: scan where each stage opens, then after every beat (the → key
// completes the next beat, exactly as a presenter would), and the finale after stage 9.
// Beats per stage, mirrored from demo/director.jsx; the desktop run checks the count against the page.
const BEATS = [1, 2, 4, 1, 2, 2, 10, 4, 2];
const TITLES = ['Connect', 'Detect', 'Verify', 'Value', 'Decide', 'Approve', 'Execute', 'Settle', 'Report'];

for (let n = 1; n <= 9; n++) {
  test(`demo · stage ${n} ${TITLES[n - 1]}`, async ({ page }, testInfo) => {
    await skipSplash(page);
    await page.goto(`/demo/Smart-Clearance%20demo%20v3.html?stage=${n}#stage=${n}`);
    await page.waitForFunction(() => (window as any).SC3_FLOW && document.querySelector('#root')?.childElementCount);
    await page.waitForTimeout(4500); // the stage's own agents run first
    const isDesktopStage = await page.locator('.demo-top').count() > 0;
    if (isDesktopStage) expect(await page.locator('.beats li').count(), 'beats per stage drifted from director.jsx').toBe(BEATS[n - 1]);

    const findings: Finding[] = [...await scan(page, `stage ${n} open`)];
    for (let b = 1; b <= BEATS[n - 1]; b++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1300);
      findings.push(...await scan(page, `stage ${n} beat ${b}`));
    }
    if (n === 9) {
      await page.keyboard.press('ArrowRight'); // Finish
      await page.waitForTimeout(1500);
      findings.push(...await scan(page, 'finale'));
    }
    await report(testInfo, findings);
  });
}
