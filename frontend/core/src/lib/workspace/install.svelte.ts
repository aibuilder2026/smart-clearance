// Installing the app: keep the browser's install prompt for when the person asks for it (design3/app/app.jsx
// useInstall). The browser offers it only to an installable page (a manifest and a service worker).
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };

class Install {
	#deferred: InstallPrompt | null = $state.raw(null);
	#bound = false;

	/** the browser has offered to install the app */
	get can() {
		return !!this.#deferred;
	}
	/** already running installed, full screen */
	get standalone() {
		return (
			(typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true
		);
	}
	listen() {
		if (this.#bound || typeof window === 'undefined') return;
		this.#bound = true;
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			this.#deferred = e as InstallPrompt;
		});
		window.addEventListener('appinstalled', () => (this.#deferred = null));
	}
	prompt = async () => {
		const d = this.#deferred;
		if (!d) return;
		void d.prompt();
		try {
			await d.userChoice;
		} catch {
			/* dismissed */
		}
		this.#deferred = null;
	};
}

export const install = new Install();
