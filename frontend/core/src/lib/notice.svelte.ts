import { createContext } from 'svelte';
import type { Person } from './components/Avatar.svelte';
import type { IconName } from './icons/registry';

/** a short confirmation at the foot of the app: "Agents resumed for Munchly Foods" */
export type Toast = { text: string; tone?: 'ok' | 'err'; icon?: IconName; ms?: number };
/** an in-app push at the top: an app name, a title and a line of body, opening something when tapped */
export type Banner = {
	title: string;
	body: string;
	app?: string;
	at?: string;
	person?: Person | null;
	/** the body is in Hindi, set in its own face */
	hindi?: boolean;
	onopen?: () => void;
	ms?: number;
};

const id = () => Math.random().toString(36).slice(2);

/** The kit's NoticeHost state (useNotice): up to two banners and three toasts, each leaving after a few seconds */
export class Notices {
	banners: (Banner & { id: string })[] = $state([]);
	toasts: (Toast & { id: string })[] = $state([]);
	// the timers that take each notice away; nothing draws from them, so they are not state
	#timers: ReturnType<typeof setTimeout>[] = [];

	#later(fn: () => void, ms: number) {
		const t = setTimeout(() => {
			this.#timers = this.#timers.filter((x) => x !== t);
			fn();
		}, ms);
		this.#timers.push(t);
	}

	push = (b: Banner) => {
		const key = id();
		this.banners = [{ id: key, ...b }, ...this.banners].slice(0, 2);
		this.#later(() => this.close(key), b.ms ?? 6200);
	};
	toast = (t: Toast) => {
		const key = id();
		this.toasts = [...this.toasts, { id: key, ...t }].slice(-3);
		this.#later(() => (this.toasts = this.toasts.filter((x) => x.id !== key)), t.ms ?? 3200);
	};
	close = (key: string) => {
		this.banners = this.banners.filter((x) => x.id !== key);
	};
	clear = () => {
		this.banners = [];
		this.toasts = [];
	};
	dispose = () => {
		this.#timers.forEach(clearTimeout);
		this.#timers = [];
	};
}

export const [useNotice, provideNotice] = createContext<Notices>();
