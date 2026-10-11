import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Catalog, ConsoleConfig, Staff } from '@smart-clearance/api/console';
import type { Notices } from '../src/lib/notice.svelte';
import { Console } from '../src/lib/console/console.svelte';
import type { ConsoleData } from '../src/lib/console/data.svelte';

// Console.act (SC-152): a button waits on it, so it resolves once the change is saved (the console is read again in
// place, not awaited), says so only when it went through, and rejects with the API's own words for the button to say.
// tell() is the same for a caller with no button: a refusal is a toast. The console's data is stood in for
const consoleWith = (notices: Partial<Notices>, refresh: () => Promise<unknown>) =>
	new Console({
		data: {} as ConsoleData,
		config: {} as ConsoleConfig,
		catalog: {} as Catalog,
		notices: notices as Notices,
		me: () => ({}) as Staff,
		refresh
	});

const later = <T>() => {
	let resolve!: (v: T) => void;
	const p = new Promise<T>((r) => (resolve = r));
	return { p, resolve };
};

describe('Console.act', () => {
	let toast: ReturnType<typeof vi.fn<(t: { text: string; tone?: string }) => void>>;
	let refresh: ReturnType<typeof vi.fn<() => Promise<void>>>;
	let read: ReturnType<typeof later<void>>;
	let k: InstanceType<typeof Console>;
	beforeEach(() => {
		toast = vi.fn<(t: { text: string; tone?: string }) => void>();
		read = later<void>();
		refresh = vi.fn<() => Promise<void>>(() => read.p);
		k = consoleWith({ toast }, refresh);
	});

	it('resolves with the answer once the change is saved, without waiting for the console to be read again', async () => {
		const out = await k.act(() => Promise.resolve(7), 'Saved');
		expect(out).toBe(7);
		expect(refresh).toHaveBeenCalledOnce();
		// the read is still out: act did not wait on it
		let landed = false;
		void read.p.then(() => (landed = true));
		await Promise.resolve();
		expect(landed).toBe(false);
	});

	it('confirms a change that went through, in its own words or from its answer', async () => {
		await k.act(
			() => Promise.resolve({ name: 'Munchly Foods' }),
			(c) => `${c.name}'s workspace is set up`
		);
		expect(toast).toHaveBeenCalledWith({ text: "Munchly Foods's workspace is set up", tone: 'ok' });
		toast.mockClear();
		await k.act(() => Promise.resolve(null));
		expect(toast).not.toHaveBeenCalled();
	});

	it("rejects with the API's words, says nothing and reads nothing again", async () => {
		await expect(
			k.act(() => Promise.reject(new Error('Only a Super admin can change a plan.')), 'Saved')
		).rejects.toThrow('Only a Super admin can change a plan.');
		expect(toast).not.toHaveBeenCalled();
		expect(refresh).not.toHaveBeenCalled();
	});

	it('a read that fails afterwards does not turn a saved change into a refusal', async () => {
		refresh.mockImplementation(() => Promise.reject(new Error('offline')));
		await expect(k.act(() => Promise.resolve('ok'), 'Saved')).resolves.toBe('ok');
		expect(toast).toHaveBeenCalledWith({ text: 'Saved', tone: 'ok' });
	});
});

describe('Console.tell', () => {
	it('says a refusal in a toast and gives undefined', async () => {
		const toast = vi.fn();
		const k = consoleWith({ toast }, () => Promise.resolve());
		expect(await k.tell(() => Promise.reject(new Error('The file is not a CSV.')), 'Uploaded')).toBeUndefined();
		expect(toast).toHaveBeenCalledWith({ text: 'The file is not a CSV.', tone: 'err' });
		toast.mockClear();
		expect(await k.tell(() => Promise.resolve(3), 'Uploaded')).toBe(3);
		expect(toast).toHaveBeenCalledWith({ text: 'Uploaded', tone: 'ok' });
	});
});
