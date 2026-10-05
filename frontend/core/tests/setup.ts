// jsdom has no matchMedia or ResizeObserver; the components ask for both (the theme, reduced motion, measuring)
if (!window.matchMedia) {
	window.matchMedia = (query: string) =>
		({
			matches: false,
			media: query,
			onchange: null,
			addEventListener() {},
			removeEventListener() {},
			addListener() {},
			removeListener() {},
			dispatchEvent: () => false
		}) as MediaQueryList;
}
if (!('ResizeObserver' in window)) {
	(window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
