// the agency's certificate of destruction (SC-139, SC-174, SC-183; ledger.js destructionDetail, destructionDoc,
// draftCertificate): the certificate in full, built from the destruction as sent and the client's destruction settings.
// It reads no seed, so the live workspace lays out the certificate to sign with it as the stub does
import { destructionLog } from './papers';
import type {
	Batch,
	Destruction,
	DestructionSettings,
	Distributor,
	Doc,
	ExpirySettlement,
	SignatureRole,
	Sku
} from './types';

const r2 = (n: number) => Math.round(n * 100) / 100;

/** the destruction as its papers read it: its agency, certificate, method, the photos' times and Priya's yes */
export type DestructionDone = Destruction & {
	agency: NonNullable<Destruction['agency']>;
	certificate: string;
	method: string;
	photos: NonNullable<Destruction['photos']>;
	checks: NonNullable<Destruction['checks']>;
	approvedAt: string;
	approvedBy: string;
};
/** the certificate in full (SC-174, option B; ledger.js destructionDetail): the goods, the reason, the agency's method
 *  and facility, the day and the window they were destroyed in, its supervising officer and the two independent
 *  witnesses (a witness on the agency's panel signs with the specimen it keeps), who handed the packs over, and the log
 *  from the godown to the cover */
function destructionDetail(
	xd: DestructionDone,
	batch: Batch,
	sku: Sku,
	dist: Distributor,
	setup: DestructionSettings
): Partial<Doc> {
	const ag = setup.agencies.find((a) => a.id === xd.agency.id),
		how = setup.methods?.[ag?.method || 'landfill'];
	const after = xd.photos.after.at,
		on = after.slice(0, 10);
	// the window the agency destroyed them in, as he gave it; else the 25 minutes up to the after photo
	const win = xd.window || {
		from: new Date(Date.parse(after + ':00Z') - 25 * 60e3).toISOString().slice(11, 16),
		to: after.slice(11, 16)
	};
	const panel = ag?.witnesses || [];
	// the four signatures as signed in place at the facility (SC-183): each signer's ink in place of a specimen on
	// file; a certificate signed before keeps its specimens
	const sg = xd.signatures ?? {};
	const signed = <P extends { name: string; sign?: string | null }>(role: SignatureRole, p: P | null): P | null => {
		const g = sg[role];
		return g && p && g.name === p.name
			? { ...p, sign: null, ink: { at: g.at, typed: !!g.typed, box: g.box ?? null, strokes: g.strokes ?? null } }
			: p;
	};
	const witnesses = (xd.witnesses && xd.witnesses.length ? xd.witnesses : panel).map(
		(w: { name: string; address?: string; proof?: string | null }, i: number) => {
			const p = panel.find((x) => x.name === w.name);
			return signed(`w${i + 1}` as SignatureRole, {
				name: w.name,
				address: w.address || p?.address || '',
				proof: w.proof || p?.proof || null,
				sign: p ? (p.sign ?? null) : null
			})!;
		}
	);
	const units = xd.units,
		kg = r2(units * sku.kgPerUnit),
		packKg = r2(units * (sku.packKg || 0));
	const photos = {
		before: { name: xd.photos.before.name!, at: xd.photos.before.at },
		after: { name: xd.photos.after.name!, at: after }
	};
	const s = dist.signatory;
	return {
		reason: 'expiry',
		methodId: ag?.method || 'landfill',
		methodName: how?.name,
		methodHow: how?.how,
		facility: ag?.facility || null,
		vehicle: ag?.vehicle || null,
		officer: signed('officer', ag?.officer || null),
		seal: ag?.seal || null,
		witnesses,
		window: win,
		destroyedOn: on,
		photos,
		handedBy: signed('handed', s ? { name: s.name, title: s.title, sign: s.sign } : null),
		goods: `${sku.brand} ${sku.name}`,
		mfg: batch.mfg,
		mrp: sku.mrp,
		perCarton: sku.perCarton,
		log: destructionLog({
			units,
			kg,
			packKg,
			batch: batch.id,
			no: xd.certificate,
			from: dist.godown,
			destroyedOn: on,
			window: win,
			photos,
			agency: xd.agency.name,
			vehicle: ag?.vehicle,
			facility: ag?.facility,
			method: ag?.method
		})
	};
}
/** the agency's certificate as it will be issued (SC-183, option B; ledger.js draftCertificate): laid out from the
 *  evidence he is sending (or sent), for the four to sign on and for the operator to review as signed; its times on
 *  expiry day (the batch's best-before), and no yes yet */
export function draftCertificate(
	xd: Destruction & { agency: NonNullable<Destruction['agency']>; certificate: string },
	on: {
		batch: Batch;
		sku: Sku;
		dist: Distributor;
		expiry: ExpirySettlement | null;
		/** the client's destruction settings: its agencies, their officers and panels, its methods */
		setup: DestructionSettings;
		evidence?: { before: string; after: string };
	}
): Doc {
	const day = on.batch.bestBefore,
		at = (t: string) => (t.length <= 5 ? `${day}T${t}` : t);
	const p = xd.photos ?? {
		before: { name: on.evidence?.before ?? 'before', at: '11:40' },
		after: { name: on.evidence?.after ?? 'after', at: '13:20' }
	};
	const x = {
		checks: [],
		method: on.setup.method,
		...xd,
		approvedAt: `${day}T00:00`,
		approvedBy: '',
		photos: { before: { ...p.before, at: at(p.before.at) }, after: { ...p.after, at: at(p.after.at) } }
	} as DestructionDone;
	return destructionDoc(x, on.expiry, on.batch, on.sku, on.dist, on.setup, {});
}
/** the agency's destruction certificate for packs destroyed at a distributor's godown (SC-139) */
export function destructionDoc(
	xd: DestructionDone,
	x: ExpirySettlement | null,
	batch: Batch,
	sku: Sku,
	dist: Distributor,
	setup: DestructionSettings,
	people: Record<string, { name: string }>
): Doc {
	const units = xd.units,
		approver = people[xd.approvedBy] ?? { name: xd.approvedBy };
	return {
		id: 'destruction',
		type: 'Destruction certificate',
		owner: xd.agency.name,
		no: xd.certificate,
		status: 'generated',
		amount: 0,
		units,
		kg: r2(units * sku.kgPerUnit),
		packKg: r2(units * (sku.packKg ?? 0)),
		at: 'godown',
		method: xd.method,
		site: xd.agency.site,
		agency: xd.agency.name,
		auth: xd.agency.auth,
		for: { name: dist.name, address: dist.address, gstin: dist.gstin },
		from: dist.godown,
		batch: batch.id,
		bestBefore: batch.bestBefore,
		hsn: sku.hsn,
		destroyedAt: xd.photos.after.at,
		evidence: { photos: 2, checks: xd.checks.filter((c) => c.ok).length, of: xd.checks.length },
		approvedBy: approver.name,
		approvedAt: xd.approvedAt,
		reversed: x && x.reversal != null ? x.reversal : r2(units * (sku.dp || 0) * sku.gst),
		date: xd.approvedAt.slice(0, 10),
		note: `Destroyed at ${xd.agency.site} on expiry day, from ${dist.godown || dist.city}. ${dist.name} reverses the input GST on these packs in GSTR-3B Table 4(B)(1) under section 17(5)(h).`,
		...destructionDetail(xd, batch, sku, dist, setup)
	};
}
