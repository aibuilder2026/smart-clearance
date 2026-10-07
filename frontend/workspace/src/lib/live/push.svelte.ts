// Web push for the live workspace (SC-73): the browser's permission, this device's Firebase Cloud Messaging token, and
// backend-api's record of it (POST/DELETE …/devices), so the Notifier can reach the member here. FCM's default VAPID
// key is used. iOS sends web push only to an app added to the Home Screen (16.4 and later), so there the ask is to install
// first. A push that arrives while the workspace is in front is handed to the page by the service worker; the page
// already has it from its live stream.
import type { FirebaseApp } from 'firebase/app';
import type { WorkspaceApi } from '@smart-clearance/api/workspace';

export type PushState = 'unsupported' | 'install-first' | 'default' | 'granted' | 'denied';

const KEY = 'sc-workspace-push-token';

/** the service worker, registered once: the offline shell, and where pushes arrive */
export function registerWorker(): Promise<ServiceWorkerRegistration | null> {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve(null);
	return navigator.serviceWorker
		.register('/service-worker.js', { type: import.meta.env.DEV ? 'module' : 'classic' })
		.catch(() => null);
}

const standalone = () =>
	typeof matchMedia !== 'undefined' &&
	(matchMedia('(display-mode: standalone)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true);
const ios = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export class Push {
	state = $state<PushState>('unsupported');
	busy = $state(false);
	#token: string | null = null;

	constructor(private o: { app: () => Promise<FirebaseApp>; api: WorkspaceApi }) {}

	/** where the device stands: whether it can take pushes, and whether the member has said yes */
	async check() {
		if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
			this.state = ios() && !standalone() ? 'install-first' : 'unsupported';
			return;
		}
		const { isSupported } = await import('firebase/messaging');
		if (!(await isSupported().catch(() => false))) {
			this.state = ios() && !standalone() ? 'install-first' : 'unsupported';
			return;
		}
		this.state = Notification.permission;
		try {
			this.#token = localStorage.getItem(KEY);
		} catch {
			this.#token = null;
		}
		// a yes given before: the token may have rotated, so it is read and recorded again
		if (this.state === 'granted') await this.#register().catch(() => undefined);
	}

	/** ask the browser, then record this device with backend-api */
	async enable() {
		if (this.state !== 'default' && this.state !== 'granted') return;
		this.busy = true;
		try {
			this.state = await Notification.requestPermission();
			if (this.state === 'granted') await this.#register();
		} finally {
			this.busy = false;
		}
	}

	/** stop pushes to this device */
	async disable() {
		const token = this.#token;
		if (!token) return;
		const { deleteToken, getMessaging } = await import('firebase/messaging');
		await deleteToken(getMessaging(await this.o.app())).catch(() => undefined);
		await this.o.api.unregisterDevice(token).catch(() => undefined);
		this.#remember(null);
	}

	async #register() {
		const reg = await registerWorker();
		if (!reg) return;
		const { getMessaging, getToken } = await import('firebase/messaging');
		const token = await getToken(getMessaging(await this.o.app()), { serviceWorkerRegistration: reg });
		if (!token) return;
		if (this.#token && this.#token !== token) await this.o.api.unregisterDevice(this.#token).catch(() => undefined);
		await this.o.api.registerDevice({ token, userAgent: navigator.userAgent });
		this.#remember(token);
	}

	#remember(token: string | null) {
		this.#token = token;
		try {
			if (token) localStorage.setItem(KEY, token);
			else localStorage.removeItem(KEY);
		} catch {
			/* storage blocked: recorded again next time */
		}
	}
}

/** pushes the service worker handed to the open page */
export function onForegroundPush(fn: (data: Record<string, string>) => void): () => void {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => undefined;
	const listen = (e: MessageEvent) => {
		if (e.data?.type === 'sc-push') fn(e.data.data ?? {});
	};
	navigator.serviceWorker.addEventListener('message', listen);
	return () => navigator.serviceWorker.removeEventListener('message', listen);
}
