// The platform's rules, ported from design3/core/platform.js (the console prototype's mock backend): what a supply-chain
// profile switches on, how far each preset lets the agents go, the one line under each agent, how a setting reads in
// the audit log, and what the setup flow and the invitations accept. The mock applies them as the server would; the
// console uses the same functions to preview a choice before it is saved. A test runs platform.js and checks these give
// the same answers.
import { isEmail } from '@smart-clearance/core/identity';
import type { Agent } from '../types/shared';
import type {
	AgentConfig,
	AgentSettings,
	Client,
	ConsoleConfig,
	ConsoleDefaults,
	ExitDef,
	Exits,
	InviteInput,
	PresetId,
	Profile,
	ProfileQuestion,
	SettingField,
	SettingValue,
	StaffInviteInput
} from '../types/console';

/** the one message for any wrong sign-in (SC-46): Firebase's email enumeration protection never says which part was
 *  wrong, and nothing is mailed, so a Super admin puts an account back on its first password */
export const SIGN_IN_FAILED =
	"That email and password don't match. Check both, or ask a Super admin to put your account back on its first password.";

/** a per-pack price: "₹13.50" */
export const money = (v: SettingValue) => '₹' + Number(v).toFixed(2);

/** how a setting's value reads in the audit log */
export function showValue(f: SettingField, v: SettingValue): string {
	if (f.type === 'money') return money(v);
	if (f.type === 'switch') return v ? 'on' : 'off';
	if (f.type === 'number' && f.key === 'confidence') return Number(v).toFixed(2);
	return f.unit ? `${v} ${f.unit}` : String(v);
}

/** the one line under each agent's name */
export function summary(agentId: string, s: AgentSettings, client: Pick<Client, 'exits' | 'people'>): string {
	switch (agentId) {
		case 'data':
			return `daily ${s.time} · ${s.backfillDays} days of history`;
		case 'watcher':
			return `daily ${s.time} · Blinkit ${s.blinkitDays}+ days, Zepto and Instamart ${s.qcomPct}% of life`;
		case 'vision':
			return `asks again below ${Number(s.confidence).toFixed(2)} confidence`;
		case 'valuer':
			return `${Object.values(client.exits).filter((x) => x.on).length} exits on, and the bin`;
		case 'router':
			return String(s.objective).toLowerCase();
		case 'gate': {
			const p = client.people.find((x) => x.id === s.approver);
			return `${p ? p.name : 'no approver'} · one tap, always`;
		}
		case 'lister':
			return `reserve ${money(s.reserve)} · ${s.territoryGuard ? "hidden inside the client's territories" : 'visible everywhere'}`;
		case 'outreach':
			return `${s.language} · ${s.scheme}`;
		case 'negotiator':
			return `floor ${money(s.floor)} · up to ${s.counters} counter${s.counters === 1 ? '' : 's'} · ${s.tokenPct}% token`;
		case 'paperwork':
			return 'drafts only; people send them';
		case 'impact':
			return `after the ${s.returnWindowDays}-day return window`;
		default:
			return '';
	}
}

/** a profile answer's label: optLabel(config.profile, 'route', 'distributors') → "Through distributors" */
export function optLabel(profile: ConsoleConfig['profile'], q: ProfileQuestion, id: string): string {
	return profile[q].options.find((o) => o.id === id)?.label ?? id;
}

/** the exits a profile allows: D2C only for the manufacturer's own stock, kiranas unless it sells only to modern trade */
export function exitsFor(profile: Profile, staffCap: number): Exits {
	const own = profile.owner === 'manufacturer' || profile.route === 'own';
	return {
		expiresoon: { on: true },
		kirana: { on: profile.route !== 'modern-trade' },
		staff: { on: true, cap: staffCap },
		foodbank: { on: true },
		d2c: { on: own, locked: own ? null : "Only for the manufacturer's own stock" }
	};
}

const SHORT: Record<string, string> = {
	expiresoon: 'ExpireSoon',
	kirana: 'kiranas',
	staff: 'staff sale',
	foodbank: 'food bank',
	d2c: 'discount D2C'
};
/** what a profile sets up, line by line */
export function profileLines(profile: Profile, exits: ExitDef[], staffCap: number): { icon: string; text: string }[] {
	const lines: { icon: string; text: string }[] = [];
	if (profile.owner === 'distributor')
		lines.push({
			icon: 'handshake',
			text: "Agents list, offer and invoice in the distributor's name, after his one-time permission"
		});
	else lines.push({ icon: 'warehouse', text: "Agents list, offer and invoice in the manufacturer's own name" });
	if (profile.expiry === 'full-credit')
		lines.push({
			icon: 'hand-coins',
			text: 'Price support is offered before stock expires, so it never comes back for full credit'
		});
	else if (profile.expiry === 'price-support')
		lines.push({ icon: 'hand-coins', text: 'Price support is the only lever; nothing comes back' });
	else
		lines.push({ icon: 'ban', text: "No returns: every unsold pack is the distributor's loss, so speed matters most" });
	const ex = exitsFor(profile, staffCap);
	lines.push({
		icon: 'route',
		text:
			'Exits: ' +
			exits
				.filter((e) => ex[e.id].on)
				.map((e) => SHORT[e.id])
				.join(', ')
	});
	if (!ex.d2c.on) lines.push({ icon: 'globe', text: "D2C stays off: it is only for the manufacturer's own stock" });
	return lines;
}

/** a workspace address from a company's name: "Kesari Foods Pvt" → "kesari" */
export const slug = (name: string) =>
	(name || '')
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/-(foods?|ltd|limited|pvt|private|india)$/g, '')
		.slice(0, 24) || 'client';

const PRESET_AUTONOMY: Record<PresetId, Record<string, 'suggest' | 'ask' | 'act'>> = {
	cautious: { data: 'act', watcher: 'act' },
	standard: { vision: 'ask', negotiator: 'ask', paperwork: 'ask' },
	trusted: { negotiator: 'ask', paperwork: 'ask' }
};

/** each agent as a new client starts with it: the preset decides autonomy; the approval gate is always on */
export function agentDefaults(
	preset: PresetId,
	agents: Agent[],
	d: ConsoleDefaults,
	approver: string | null = null
): Record<string, AgentConfig> {
	const auto = PRESET_AUTONOMY[preset] ?? {};
	const base = preset === 'cautious' ? 'suggest' : 'act';
	const settings: Record<string, AgentSettings> = {
		data: { time: '08:30', backfillDays: 90 },
		watcher: { time: '09:00', blinkitDays: d.gates.blinkitDays, qcomPct: d.gates.qcomPct },
		vision: { confidence: 0.9 },
		valuer: { indicative: true },
		router: { objective: 'Most money recovered' },
		gate: { approver },
		lister: { reserve: d.reserve, territoryGuard: true },
		outreach: { language: 'Hindi first', scheme: '2 free with every 10' },
		negotiator: { floor: d.reserve, counters: 2, tokenPct: d.tokenPct },
		paperwork: { draftsOnly: true },
		impact: { returnWindowDays: d.returnWindowDays }
	};
	const out: Record<string, AgentConfig> = {};
	for (const a of agents)
		out[a.id] = {
			on: true,
			autonomy: a.gate ? 'gate' : (auto[a.id] ?? base),
			settings: settings[a.id],
			last: null,
			next: null
		};
	return out;
}

/** what an invitation to a client's workspace must carry, or the problem with it */
export function inviteError(input: InviteInput, client: Pick<Client, 'name' | 'emailDomain'>): string | null {
	const contact = input.contact.trim();
	const phone = /^[+\d\s]{10,}$/.test(contact);
	const email = isEmail(contact);
	if (!input.name.trim()) return 'Enter a name.';
	if (!phone && !email) return 'Enter a work email address or a mobile number.';
	if (email && input.access !== 'Partner' && !contact.toLowerCase().endsWith('@' + client.emailDomain))
		return `${client.name} staff need a ${client.emailDomain} address. Partners can use any address or a phone number.`;
	return null;
}

/** what an invitation to the console must carry, or the problem with it */
export function staffInviteError(input: StaffInviteInput): string | null {
	if (!input.name.trim()) return 'Enter a name.';
	if (!/^[^\s@]+@smartclearance\.com$/i.test(input.email.trim())) return 'Staff use a smartclearance.com address.';
	return null;
}

/** the setup flow's answers, as far as they need checking */
export type SetupAnswers = {
	name: string;
	city: string;
	slug: string;
	emailDomain: string;
	signGoogle: boolean;
	signPhone: boolean;
	exits: Exits;
	adminName: string;
	adminEmail: string;
};
/** the setup flow's seven steps, and the problem with each one's answers (null when it is fine) */
export function setupErrors(f: SetupAnswers, taken: (slug: string) => boolean): (string | null)[] {
	const domain = f.emailDomain.trim().toLowerCase();
	const domainOk = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain);
	const adminOk =
		f.adminName.trim() &&
		isEmail(f.adminEmail) &&
		f.adminEmail
			.trim()
			.toLowerCase()
			.endsWith('@' + domain);
	return [
		!f.name.trim() ? "Enter the company's name." : !f.city.trim() ? 'Enter its home city.' : null,
		!/^[a-z0-9-]{2,24}$/.test(f.slug)
			? 'Use 2 to 24 lowercase letters, digits or hyphens.'
			: taken(f.slug)
				? `${f.slug}.smartclearance.com is taken.`
				: !domainOk
					? 'Enter the domain its staff email from, such as kesari.in.'
					: !(f.signGoogle || f.signPhone)
						? 'Keep at least one way to sign in.'
						: null,
		null,
		Object.values(f.exits).some((x) => x.on) ? null : 'Keep at least one exit on.',
		null,
		!adminOk ? `Enter the admin's name and a ${f.emailDomain ? '@' + f.emailDomain : 'company'} address.` : null,
		null
	];
}
