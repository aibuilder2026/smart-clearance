import { expect, test, type Page } from '@playwright/test';
import { beatsDone, device, next, nextUntil, openDemo, settle, stageOf } from './demo';

// The guided demo played through (SC-65), against its in-memory stub: by Next, by the moves the visitor makes inside the
// devices, by Back, Restart and Play it again, on autoplay, and with its views (phone only, the notes) and its address

const title = (page: Page) => page.locator('.narr-title');
const narration = (page: Page) => page.getByRole('complementary', { name: 'Narration' });
/** the stage and the beats ticked off, as one value that any move changes */
const where = async (page: Page) =>
	(await page.locator('.finale').count()) ? 'finale' : `${stageOf(page)}:${await beatsDone(page)}`;

test('flows · → plays the story from the sign-in to the finale, one beat a press: 41 in all', async ({ page }) => {
	await openDemo(page, 1);
	let presses = 0;
	// each press is the person's move, an agent skipped ahead or the next stage, and the next comes before any agent
	// could move on by itself (its shortest wait is 0.26 s)
	while ((await where(page)) !== 'finale' && presses < 50) {
		const before = await where(page);
		await page.keyboard.press('ArrowRight');
		presses += 1;
		await expect.poll(() => where(page), { timeout: 2000, intervals: [20] }).not.toBe(before);
	}
	expect(presses, 'nine stages: 32 beats, eight moves to the next stage and one to the finale').toBe(41);
	await expect(page.getByRole('heading', { name: 'Every carton gets a second chance' })).toBeVisible();
	await expect(page.locator('.finale-facts')).toContainText('0 cartons destroyed');
});

test("flows · the same moves made inside the devices: the sign-ins and Rakesh bhai's Allow", async ({ page }) => {
	await openDemo(page, 1);
	const laptop = device(page, "Priya's laptop");
	await laptop.getByRole('button', { name: 'Continue' }).click();
	await laptop
		.getByRole('dialog', { name: 'Sign in with Google' })
		.getByRole('button', { name: /Priya Deshmukh/ })
		.click();
	await expect.poll(() => beatsDone(page), 'her sign-in ticks the first beat').toBe(1);
	await laptop.getByRole('button', { name: 'Confirm and start watching' }).click();
	await expect.poll(() => beatsDone(page), 'and confirming the setup the second').toBe(2);

	const phone = device(page, "Rakesh bhai's phone");
	await phone.getByRole('button', { name: 'Continue' }).click();
	await phone
		.getByRole('dialog', { name: 'Enter the code' })
		.getByRole('button', { name: 'Verify and continue' })
		.click();
	await expect.poll(() => beatsDone(page), "Rakesh bhai's sign-in the third").toBe(3);
	await phone.getByRole('button', { name: 'Allow' }).click();
	await expect.poll(() => beatsDone(page), 'and his permission the fourth').toBe(4);
	await expect(narration(page).getByRole('button', { name: 'Next stage · Detect' })).toBeVisible();
});

test("flows · a push tapped on Priya's phone, and the plan approved there", async ({ page }) => {
	await openDemo(page, 2);
	const phone = device(page, "Priya's phone");
	await phone.locator('.lock-note').click();
	await expect.poll(() => beatsDone(page), 'the push opened').toBe(2);
	await expect(narration(page).getByRole('button', { name: 'Next stage · Verify' })).toBeVisible();

	// Review and approve opens the approval in the phone; the beat that names it ticks only on Next (the prototype's
	// director does the same: opening a sheet changes nothing in the store), so Next opens it here
	await page.keyboard.press('6');
	await settle(page, 0);
	await phone.getByRole('button', { name: 'Review and approve' }).click();
	const sheet = phone.getByRole('dialog', { name: 'Approve the plan' });
	await expect(sheet).toBeVisible();
	await sheet.getByRole('button', { name: 'Not now' }).click();
	await expect(sheet).toHaveCount(0);
	await page.keyboard.press('ArrowRight');
	await expect(sheet, 'Next opens it in the phone').toBeVisible();
	await expect.poll(() => beatsDone(page), 'the approval opened').toBe(1);
	await sheet.getByRole('button', { name: 'Approve · release the agents' }).click();
	await expect(phone.getByRole('dialog', { name: 'Plan placed' })).toBeVisible();
	await expect.poll(() => beatsDone(page), 'one tap').toBe(2);
});

test("flows · Ganesh ji's order, then Agrawal ji's bid and his accepting the counter", async ({ page }) => {
	await openDemo(page, 7);
	const ganesh = device(page, "Ganesh ji's phone");
	await ganesh.locator('.lock-note').click();
	await expect(ganesh.getByRole('button', { name: /ऑर्डर करें/ })).toBeVisible();
	await ganesh.getByRole('button', { name: /ऑर्डर करें/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'He takes a carton' })).toHaveCount(1);

	await nextUntil(page, "Agrawal ji's phone", 'Agrawal ji');
	const agrawal = device(page, "Agrawal ji's phone");
	await agrawal.getByRole('button', { name: /^Bid ₹/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'bids ₹13' })).toHaveCount(1);
	// the Negotiator counters by itself
	const accept = agrawal.getByRole('button', { name: /^Accept ₹/ });
	await expect(accept).toBeVisible({ timeout: 10_000 });
	await accept.click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Agrawal ji accepts' })).toHaveCount(1);
	await expect(page.locator('.narr .beat.now')).toContainText('Meera at Feeding India');
});

test('flows · Back starts the stage again, then goes to the one before; Restart goes to the start', async ({
	page
}) => {
	await openDemo(page, 3);
	expect(await beatsDone(page), "Vision's request").toBe(1);
	const back = narration(page).getByRole('button', { name: 'Back' });
	await back.click();
	await settle(page, 1800);
	await expect(page).toHaveURL(/#stage=3$/);
	expect(await beatsDone(page), 'the stage again: Vision asks again').toBe(1);
	await page.keyboard.press('6');
	await settle(page, 0);
	await back.click();
	await settle(page, 1600);
	await expect(page, 'from the first beat, the stage before').toHaveURL(/#stage=5$/);
	await expect(title(page)).toHaveText('Decide');

	await page.getByRole('button', { name: 'Restart' }).click();
	await settle(page, 0);
	await expect(page).toHaveURL(/#stage=1$/);
	await expect(title(page)).toHaveText('Connect');
	expect(await beatsDone(page)).toBe(0);
	await expect(back, 'nothing before the first beat').toBeDisabled();
});

test('flows · the finale: Stay on the last stage, then Play it again', async ({ page }) => {
	await openDemo(page, 9);
	await next(page);
	await expect(narration(page).getByRole('button', { name: 'Finish' })).toBeVisible();
	await narration(page).getByRole('button', { name: 'Finish' }).click();
	const finale = page.getByRole('dialog', { name: 'Every carton gets a second chance' });
	await expect(finale).toBeVisible();
	await finale.getByRole('button', { name: 'Stay on the last stage' }).click();
	await expect(finale).toHaveCount(0);
	await expect(page).toHaveURL(/#stage=9$/);
	await page.keyboard.press('ArrowRight');
	await expect(finale).toBeVisible();
	await page.keyboard.press('ArrowLeft');
	await expect(finale, '← closes it too').toHaveCount(0);
	await page.keyboard.press('ArrowRight');
	await finale.getByRole('button', { name: 'Play it again' }).click();
	await expect(finale).toHaveCount(0);
	await expect(page).toHaveURL(/#stage=1$/);
	await expect(title(page)).toHaveText('Connect');
	await expect(device(page, "Priya's laptop").getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

test('flows · autoplay moves the people on by itself, and Pause stops it', async ({ page }) => {
	await openDemo(page, 1);
	await page.getByRole('button', { name: 'Autoplay' }).click();
	await expect.poll(() => beatsDone(page), { timeout: 8000 }).toBeGreaterThanOrEqual(2);
	await page.getByRole('button', { name: 'Pause autoplay' }).click();
	const held = await beatsDone(page);
	await page.waitForTimeout(3500);
	expect(await beatsDone(page), 'paused, nothing moves on').toBe(held);
	await page.getByRole('button', { name: 'Autoplay' }).click();
	await expect(page, 'on to the next stage, and its agents').toHaveURL(/#stage=2$/, { timeout: 15_000 });
	await page.getByRole('button', { name: 'Pause autoplay' }).click();
});

test('flows · phone only shows the person in focus, and the notes hide and come back', async ({ page }) => {
	await openDemo(page, 1);
	await page.getByRole('button', { name: 'Phone only' }).click();
	await expect(page.locator('.devices .dev')).toHaveCount(1);
	await expect(page.locator('.dev-label b'), "Priya's move, on her phone").toHaveText("Priya's phone");
	await expect(device(page, "Priya's phone").getByRole('heading', { name: 'Sign in' })).toBeVisible();
	await next(page);
	await page.getByRole('button', { name: 'Laptop and phone' }).click();
	await expect(page.locator('.devices .dev')).toHaveCount(2);

	await page.getByRole('button', { name: 'Hide notes' }).click();
	await expect(narration(page)).toHaveCount(0);
	await expect(page.locator('.demo')).toHaveClass(/no-notes/);
	await page.getByRole('button', { name: 'Show notes' }).click();
	await expect(narration(page)).toBeVisible();
	expect(await beatsDone(page), 'the story kept its place').toBe(1);
});

test('flows · the stage is in the address, and a reload keeps it', async ({ page }) => {
	await openDemo(page, 5);
	await expect(title(page)).toHaveText('Decide');
	await page.keyboard.press('8');
	await expect(page).toHaveURL(/#stage=8$/);
	await page.reload();
	await page.waitForSelector('.demo .devices .dev-ring');
	await expect(title(page)).toHaveText('Settle');
	await expect(page.locator('.stagebar [aria-current="step"]')).toHaveAccessibleName('Settle, stage 8');
});
