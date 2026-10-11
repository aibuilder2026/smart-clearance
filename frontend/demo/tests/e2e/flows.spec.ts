import { expect, test, type Page } from '@playwright/test';
import { atOf, beatsDone, device, LINE, next, nextUntil, openDemo, settle, stationOf, theEnd } from './demo';

// The guided demo played through (SC-167), against its in-memory stub and the console's demo world: by Next, by the
// moves the visitor makes inside the devices, on the map, by Back, on autoplay, with its views (phone only, the notes)
// and its address

const title = (page: Page) => page.locator('.narr-title');
const narration = (page: Page) => page.getByRole('complementary', { name: 'Narration' });

test("flows · → rides the whole route, from the console to the slow week's end", async ({ page }) => {
	await openDemo(page, [LINE.console, 0, 0]);
	let presses = 0;
	const lines = new Set<number>();
	while (!(await theEnd(page).count()) && presses < 200) {
		// between lines the map shows the token hopping to the next; Escape closes it
		if (await page.locator('.rb-over').count()) {
			await expect(page.locator('.rb-over .rb-eyebrow')).toHaveText('Next line');
			await page.keyboard.press('Escape');
		}
		lines.add(atOf(page)[0]);
		await page.keyboard.press('ArrowRight');
		presses += 1;
		await page.waitForTimeout(250);
	}
	expect([...lines].sort(), 'every line played').toEqual([0, 1, 2, 3]);
	await expect(theEnd(page).getByRole('heading', { name: 'Three batches, three endings' })).toBeVisible();
	await expect(theEnd(page)).toContainText('₹21,152');
	await expect(theEnd(page)).toContainText('₹16,917');
	await expect(theEnd(page)).toContainText('₹18,632');
});

test('flows · the start: the map names each line, and a station opens the story there', async ({ page }) => {
	await openDemo(page);
	await expect(page.getByRole('heading', { name: 'Three batches. Three endings.' })).toBeVisible();
	const map = page.getByRole('group', { name: /The demo's route map/ });
	for (const name of ['The platform', 'Masala Chips', 'Masala Chips · a slow week', 'Mango Drink'])
		await expect(map.getByRole('button', { name: new RegExp(`^${name}`) }).first()).toBeVisible();
	await map.getByRole('button', { name: 'Mango Drink: Execute' }).click();
	await page.waitForSelector('.demo .devices .dev-ring');
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.mango}.3`);
	await expect(title(page)).toHaveText('Execute');
	await expect(page.locator('.rb-strip-line')).toContainText('Mango Drink');
});

test("flows · the chips: the sign-ins and Rakesh bhai's Allow, made inside the devices", async ({ page }) => {
	await openDemo(page, [LINE.chips, 0, 0]);
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
	await phone.locator('.lock-note').click();
	await expect.poll(() => beatsDone(page), 'his invitation opened').toBe(3);
	await phone.getByRole('button', { name: 'Continue' }).click();
	await phone
		.getByRole('dialog', { name: 'Enter the code' })
		.getByRole('button', { name: 'Verify and continue' })
		.click();
	await expect.poll(() => beatsDone(page), "Rakesh bhai's sign-in").toBe(4);
	await phone.getByRole('button', { name: 'Allow' }).click();
	await expect.poll(() => beatsDone(page), 'and his permission').toBe(5);
	await expect(narration(page).getByRole('button', { name: 'Next · Detect' })).toBeVisible();
});

test("flows · the chips: the plan approved on Priya's phone, Ganesh ji's order, Agrawal ji's bid", async ({ page }) => {
	await openDemo(page, [LINE.chips, 5, 0]);
	const phone = device(page, "Priya's phone");
	// the approval opens by itself as its beat begins
	const sheet = phone.getByRole('dialog', { name: 'Approve the plan' });
	await expect(sheet).toBeVisible();
	await sheet.getByRole('button', { name: 'Approve · release the agents' }).click();
	await expect(phone.getByRole('dialog', { name: 'Plan placed' })).toBeVisible();
	await expect.poll(() => beatsDone(page), 'one tap').toBe(2);

	await page.keyboard.press('ArrowRight'); // on to Execute, whose agents list the lot and send the scheme
	await settle(page);
	const ganesh = device(page, "Ganesh ji's phone");
	await ganesh.getByRole('button', { name: /ऑर्डर करें/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Ganesh ji takes a carton' })).toHaveCount(1);
	await nextUntil(page, "Agrawal ji's phone", 'Agrawal');
	const agrawal = device(page, "Agrawal ji's phone");
	await agrawal.getByRole('button', { name: /^Bid ₹/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'bids ₹13' })).toHaveCount(1);
	const accept = agrawal.getByRole('button', { name: /^Accept ₹/ });
	await expect(accept, 'the Negotiator counters by itself').toBeVisible({ timeout: 10_000 });
	await accept.click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Agrawal ji accepts' })).toHaveCount(1);
});

test("flows · the Mango Drink: Lakshmi Agencies' staff sale and Meera's pickup, made in their phones", async ({
	page
}) => {
	await openDemo(page, [LINE.mango, 3, 0]);
	await nextUntil(page, "Lakshmi Agencies' phone", 'staff');
	const lakshmi = device(page, "Lakshmi Agencies' phone");
	await lakshmi.getByRole('button', { name: /Record the sale/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Lakshmi Agencies sells' })).toHaveCount(1);
	const meera = device(page, "Meera's phone");
	await meera.getByRole('button', { name: 'Confirm' }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Meera at Feeding India confirms' })).toHaveCount(1);
	await meera.getByRole('button', { name: /Mark collected|Collected/ }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'She collects' })).toHaveCount(1);
	await expect(meera).toContainText('FI/HYD/26-27/0417');
});

test("flows · the slow week: Rakesh bhai's evidence, then Priya's second yes in the destruction sheet", async ({
	page
}) => {
	await openDemo(page, [LINE.slow, 2, 0]);
	await nextUntil(page, "Rakesh bhai's phone", 'Two photos');
	const rakesh = device(page, "Rakesh bhai's phone");
	await rakesh.getByRole('button', { name: 'Send to Munchly Foods for approval' }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'Two photos' })).toHaveCount(1);

	await openDemo(page, [LINE.slow, 3, 2]);
	const laptop = device(page, "Priya's laptop");
	const sheet = laptop.getByRole('dialog', { name: 'Approve the destruction' });
	await expect(sheet, 'the sheet opens as the beat begins').toBeVisible();
	await expect(sheet).toContainText('OCE/DC/26-27/0219');
	await sheet.getByRole('button', { name: 'Approve · issue the papers' }).click();
	await expect(page.locator('.narr .beat.done', { hasText: 'she approves' })).toHaveCount(1);
	await expect(narration(page).getByRole('button', { name: 'Next · Report' })).toBeVisible();
});

test("flows · the console on Neha's laptop: the Overview's food, and New client from Kesari Foods' request", async ({
	page
}) => {
	await openDemo(page, [LINE.console, 1, 2]);
	const laptop = device(page, "Neha's laptop");
	await expect(laptop.getByRole('heading', { name: 'Food, by day' })).toBeInViewport();
	await openDemo(page, [LINE.console, 3, 1]);
	await expect(laptop.getByRole('heading', { name: 'New client' })).toBeVisible();
	await expect(laptop.getByLabel('Company name')).toHaveValue('Kesari Foods');
	// the visitor can wander off in the console; the next beat points it back
	await laptop
		.getByRole('link', { name: /Clients/ })
		.first()
		.click();
	await expect(laptop.getByRole('heading', { name: 'Clients' })).toBeVisible();
	await next(page);
	await expect(laptop.getByRole('heading', { name: 'Munchly Foods' })).toBeVisible();
});

test('flows · Back goes a beat back, past what an agent does on its own; Map jumps anywhere; the mark goes back to the start', async ({
	page
}) => {
	// Verify: Vision asks (by itself), the push, Rakesh bhai's photo, Gemini's read; opened on the photo
	await openDemo(page, [LINE.chips, 2, 2]);
	const back = narration(page).getByRole('button', { name: 'Back' });
	await back.click();
	await settle(page);
	expect(atOf(page), 'the push before it').toEqual([LINE.chips, 2, 1]);
	await page.keyboard.press('ArrowLeft');
	await settle(page);
	expect(stationOf(page), "past Vision's request, which it would make again at once: the station before").toBe(
		`${LINE.chips}.1`
	);
	await expect(title(page)).toHaveText('Detect');

	await page.getByRole('button', { name: 'Open the route map' }).click();
	const map = page.getByRole('dialog', { name: 'The route map' });
	await expect(map).toBeVisible();
	await map.getByRole('button', { name: 'Masala Chips · a slow week: The second yes' }).click();
	await expect(map).toHaveCount(0);
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.slow}.3`);

	await page.getByRole('button', { name: 'Back to the route map' }).click();
	await expect(page.getByRole('heading', { name: 'Three batches. Three endings.' })).toBeVisible();
});

test('flows · the end: Stay on the last stop, then Ride it again', async ({ page }) => {
	await openDemo(page, [LINE.slow, 4, 0]);
	for (let i = 0; i < 8 && !(await theEnd(page).count()); i++) await page.keyboard.press('ArrowRight');
	await expect(theEnd(page)).toBeVisible();
	await theEnd(page).getByRole('button', { name: 'Stay on the last stop' }).click();
	await expect(theEnd(page)).toHaveCount(0);
	expect(stationOf(page)).toBe(`${LINE.slow}.4`);
	await page.keyboard.press('ArrowRight');
	await expect(theEnd(page)).toBeVisible();
	await theEnd(page).getByRole('button', { name: 'Ride it again' }).click();
	await expect(theEnd(page)).toHaveCount(0);
	await settle(page);
	expect(stationOf(page)).toBe(`${LINE.console}.0`);
});

test('flows · autoplay moves the people on by itself, and Pause stops it', async ({ page }) => {
	await openDemo(page, [LINE.chips, 0, 0]);
	await page.getByRole('button', { name: 'Play the route' }).click();
	await expect.poll(() => beatsDone(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
	await page.getByRole('button', { name: 'Pause' }).click();
	const held = await beatsDone(page);
	await page.waitForTimeout(3500);
	expect(await beatsDone(page), 'paused, nothing moves on').toBe(held);
	await page.getByRole('button', { name: 'Play the route' }).click();
	await expect.poll(() => stationOf(page), { timeout: 20_000 }).toBe(`${LINE.chips}.1`);
	await page.getByRole('button', { name: 'Pause' }).click();
});

test('flows · phone only shows the person in focus, and the notes hide and come back', async ({ page }) => {
	await openDemo(page, [LINE.chips, 0, 0]);
	await page.getByRole('button', { name: 'Phone only' }).click();
	await expect(page.locator('.devices .dev')).toHaveCount(1);
	await expect(page.locator('.dev-label b'), "Priya's move, on her phone").toHaveText("Priya's phone");
	await page.getByRole('button', { name: 'Laptop and phone' }).click();
	await expect(page.locator('.devices .dev')).toHaveCount(2);
	await page.getByRole('button', { name: 'Hide notes' }).click();
	await expect(narration(page)).toHaveCount(0);
	await expect(page.locator('.demo')).toHaveClass(/no-notes/);
	await page.getByRole('button', { name: 'Show notes' }).click();
	await expect(narration(page)).toBeVisible();
});

test('flows · the place is in the address, a reload keeps it, and the old #stage=N opens the chips there', async ({
	page
}) => {
	await openDemo(page, [LINE.mango, 2, 1]);
	await expect(title(page)).toHaveText('Decide');
	await page.reload();
	await page.waitForSelector('.demo .devices .dev-ring');
	await expect(title(page)).toHaveText('Decide');
	await expect(page.locator('.rb-strip-line')).toContainText('Mango Drink');
	await page.goto('/#stage=8');
	await page.reload();
	await page.waitForSelector('.demo .devices .dev-ring');
	expect(stationOf(page)).toBe(`${LINE.chips}.7`);
	await expect(title(page)).toHaveText('Settle');
});
