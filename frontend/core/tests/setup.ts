// jsdom has no matchMedia, ResizeObserver or IntersectionObserver; the components ask for them (the theme, reduced
// motion, measuring, a Page's bar taking its glass on scroll)
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
if (!('IntersectionObserver' in window)) {
	(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() {
			return [];
		}
	};
}
