import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { D, KL } from '../src/lib/workspace/data';
import { fastForward } from '../src/lib/workspace/flow';
import { store } from '../src/lib/workspace/store.svelte';
import { stubSource as ws } from '../src/lib/workspace/stub.svelte';

// The workspace source (SC-67): the app's entry carries no data, and the stub behind the source makes each step as the
// screens made it before they read a source.
const here = dirname(fileURLToPath(import.meta.url));
const lib = join(here, '../src/lib');

/** every module a file imports for its values, followed through the package's own files */
function graph(entry: string) {
	const seen = new Set<string>();
	const visit = (file: string) => {
		if (seen.has(file)) return;
		seen.add(file);
		if (!/\.(ts|svelte)$/.test(file)) return;
		let src = readFileSync(file, 'utf8');
		if (file.endsWith('.svelte'))
			src = [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
		const specs = [...src.matchAll(/^\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/gm)].map(
			(m) => m[1]
		);
		for (const s of specs) {
			if (!s.startsWith('.')) continue;
			const base = resolve(dirname(file), s);
			const hit = [base, base + '.ts', base + '.svelte', join(base, 'index.ts')].find(
				(p) => existsSync(p) && !p.endsWith('/')
			);
			if (hit && !(hit === base && !/\.(ts|svelte|json)$/.test(base))) visit(hit);
		}
	};
	visit(entry);
	return [...seen].map((f) => relative(lib, f));
}

describe("the app's entry", () => {
	it('carries none of the stub: not its seed, store, journey or source', () => {
		const files = graph(join(lib, 'workspace/app.ts'));
		expect(files).toContain('workspace/WorkspaceApp.svelte');
		expect(files).toContain('workspace/screens/brand/RouteRoom.svelte');
		const stub = files.filter((f) =>
			/^workspace\/(data\.ts|store\.svelte\.ts|flow\.ts|stub\.svelte\.ts|stub\.ts|index\.ts|seed\/)/.test(f)
		);
		expect(stub).toEqual([]);
	});
	it('while the full entry still has them, for the guided demo', () => {
		const files = graph(join(lib, 'workspace/index.ts'));
		expect(files).toContain('workspace/data.ts');
		expect(files).toContain('workspace/stub.svelte.ts');
	});
});

describe('the stub source', () => {
	afterEach(() => vi.useRealTimers());

	it("holds the seed's data and the batch the story follows", () => {
		expect(ws.kind).toBe('stub');
		expect(ws.status.phase).toBe('ready');
		expect(ws.data.workspace).toBe(D.workspace);
		expect(ws.case.batch).toBe(D.batches[0]);
		expect(ws.case.lines.kirana).toBe(KL);
		expect(ws.case.donation.units).toBe(D.mangoFb);
		expect(Object.isFrozen(ws.data) && Object.isFrozen(ws.case)).toBe(true);
	});
	it('takes a step at once, or after the felt delay', async () => {
		vi.useFakeTimers();
		fastForward(1);
		await ws.act('permit');
		expect(store.state.setup.permission).not.toBeNull();
		const done = ws.act('pause', true, { feel: 600 });
		expect(store.state.setup.permission!.paused).toBe(false);
		expect(ws.pending.has('pause')).toBe(true);
		vi.advanceTimersByTime(600);
		await done;
		expect(store.state.setup.permission!.paused).toBe(true);
		expect(ws.pending.size).toBe(0);
	});
	it("makes a kirana's order with its own count as one change", async () => {
		fastForward(6);
		for (const a of ['list', 'outreach'] as const) await ws.act(a as never);
		const seq = store.state.seq;
		await ws.act('order', { kirana: 'k0', units: 12 });
		expect(store.state.seq).toBe(seq + 1);
		expect(store.state.hero.orders).toEqual([{ id: 'k0', units: 12, at: D.kiranas[0].at }]);
	});
	it('marks notifications read, by id', async () => {
		fastForward(2);
		await ws.act('permit');
		store.update((s) => s.notifications.forEach((n) => (n.read = false)));
		const [first] = store.state.notifications;
		await ws.markRead([first.id]);
		expect(store.state.notifications.find((n) => n.id === first.id)!.read).toBe(true);
		expect(store.state.notifications.filter((n) => !n.read).length).toBe(store.state.notifications.length - 1);
	});
	it("signs in and out, and the person's admin steps are written in their name, each with its own audit line", async () => {
		fastForward(0);
		const me = await ws.signIn({ uid: 'arjun' });
		expect(ws.me?.id).toBe(me.id);
		expect(store.state.users.find((u) => u.id === 'arjun')!.lastSeen).toBe('now');
		const seq = store.state.seq;
		await ws.invite({ name: 'Shree Balaji Kirana', contact: '+91 98230 60099', role: 'retailer' });
		const u = store.state.users.at(-1)!;
		expect(u).toMatchObject({ name: 'Shree Balaji Kirana', provider: 'phone', status: 'invited', invitedBy: me.name });
		await ws.setUserRole(u.id, 'distributor');
		await ws.setUserStatus(u.id, 'deactivated');
		await ws.saveRules({ ...store.state.rules, approvalTaps: 5 });
		expect(store.state.seq).toBe(seq + 8);
		expect(store.state.audit.slice(0, 4).map((a) => [a.who, a.what])).toEqual([
			['arjun', 'updated the guardrails'],
			['arjun', 'deactivated'],
			['arjun', 'changed the role to distributor'],
			['arjun', 'invited Shree Balaji Kirana as kirana retailer']
		]);
		await ws.signOut();
		expect(ws.me).toBeNull();
	});
});
