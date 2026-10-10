import { expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { as, caseAs, hero, inr, running, story, until, type Step } from './flow.ts';

// Packs destroyed at the distributor's godown (SC-139, Munchly's route B), the steps both leftover flows share. On
// expiry day the packs no channel took wait for his evidence: he opens the step on his Today, takes or uploads the two
// photos (design3's evidence for the batch: before at the godown with the label in view, after at the landfill with
// the slate), names the agency and its certificate, and sends it; Vision checks it on live Gemini. Priya reviews it
// from her Command Center and approves, and only then does Impact report: the expiry credit note's three lines and the
// agency's certificate.

const EVIDENCE = (ref: string, which: 'before' | 'after') =>
	fileURLToPath(new URL(`../../../../design3/system/img/evidence/${ref}-${which}.webp`, import.meta.url));

/** the distributor sends the evidence from his Today; `who` his member, `certificate` the agency's number */
export function destroyStep(o: { who: string; agency: string; certificate: string }): Step {
	return {
		id: 'destroy',
		title: `${o.who === 'rakesh' ? 'Rakesh bhai' : 'Lakshmi Agencies'} destroys the packs left at the godown and sends the evidence`,
		async run(page) {
			const run = running();
			const ref = hero();
			const asked = await until('the destruction is asked for', 'priya', (c) => !!c.destruction, 120_000);
			const units = asked.destruction!.units;
			story('Destruction asked for', asked.destruction!.status, 'requested');
			run.figure('Packs to destroy', units);
			await as(page, o.who, '/home', `opens the destruction of ${units} expired packs on Today`);
			const step = page.getByRole('button', { name: 'Send the evidence' }).first();
			await expect(step).toBeVisible();
			await run.done(`Today: Destroy ${units} expired packs at your godown`);
			await step.click();
			await expect(page).toHaveURL(new RegExp(`/destroy/${ref}`));
			await expect(page.getByRole('button', { name: /Send to .* for approval/ })).toBeDisabled();
			const uploads = page.locator('input[type="file"]:not([capture])');
			await uploads.nth(0).setInputFiles(EVIDENCE(ref, 'before'));
			await uploads.nth(1).setInputFiles(EVIDENCE(ref, 'after'));
			await expect(page.locator('.dz-slot .cam-tag', { hasText: '1 · Before' })).toBeVisible();
			await run.done('Destroy expired packs: the photo before, at the godown, and after, at the landfill');
			await page.getByLabel('Agency', { exact: true }).selectOption({ label: o.agency });
			await page.getByLabel("Agency's certificate number").fill(o.certificate);
			await expect(page.getByText(/reverse ₹[\d,.]+ of input GST on these packs in your GSTR-3B/)).toBeVisible();
			await run.done(`${o.agency}, certificate ${o.certificate}: the GST he reverses named`);
			await page.getByRole('button', { name: /Send to .* for approval/ }).click();
			const c = await until("Vision checks the destruction's evidence", 'priya', (c) =>
				['checked', 'approved'].includes(c.destruction?.status ?? '')
			);
			for (const x of c.destruction!.checks) run.figure(`Vision: ${x.id}`, `${x.ok ? 'ok' : 'not ok'} · ${x.label}`);
			const failed = c.destruction!.checks.filter((x) => !x.ok);
			if (failed.length)
				run.find('note', `/destroy/${ref}`, `Vision's checks not passed: ${failed.map((x) => x.label).join('; ')}`);
			await as(page, o.who, `/destroy/${ref}`, 'reads that it went for approval');
			await expect(page.getByText('Sent for approval')).toBeVisible();
			await run.done('Destroy expired packs: sent for approval');
		}
	};
}

/** Priya approves the destruction from her Command Center, and Impact reports */
export function approveDestructionStep(): Step {
	return {
		id: 'destroyed',
		title: "Priya reviews the destruction's evidence from the Command Center and approves it; Impact reports",
		async run(page) {
			const run = running();
			const ref = hero();
			const before = (await caseAs('priya'))!;
			await as(page, 'priya', '/command', "reviews the destruction's evidence");
			const review = page.getByRole('button', { name: 'Review the destruction' });
			await expect(review).toBeVisible();
			await run.done('Command Center: the destruction waits for your yes');
			await review.click();
			const sheet = page.getByRole('dialog', { name: 'Approve the destruction' });
			await expect(sheet).toBeVisible();
			await expect(sheet.locator('img.cam-feed')).toHaveCount(2);
			const amount = before.expiry?.amount;
			if (amount != null)
				await expect(sheet).toContainText(
					`₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
				);
			run.figure('Expiry credit note on the yes', inr(amount ?? undefined));
			await run.done('The review: both photos, Vision’s checks, what the yes issues');
			await sheet.getByRole('button', { name: 'Approve · issue the papers' }).click();
			const c = await until('Impact posts the ledger', 'priya', (c) => c.journey.posted);
			story('Destruction', c.destruction?.status, 'approved');
			story('Expiry policy', c.expiry?.policy, 'godown');
			const paper = c.docs.find((d) => d.id === 'expiry');
			const cert = c.docs.find((d) => d.id === 'destruction');
			story('Expiry credit note', paper?.amount ?? undefined, amount ?? 0);
			story('Destruction certificate', cert?.status, 'generated');
			run.figure('Certificate', `${cert?.no} (${cert?.units} packs)`);
			await run.done(`Impact posted the ledger on the yes: ${paper?.no}, ${cert?.no}`);
			await expect(page.getByText(new RegExp(`Cleared · [\\d,]+ packs destroyed at the godown`)).first()).toBeVisible({
				timeout: 30_000
			});
			await run.done(`Command Center: ${ref} cleared, its packs destroyed at the godown`);
		}
	};
}
