// jsdom lacks what the screens ask for: matchMedia, ResizeObserver, IntersectionObserver, Web Animations, scrollTo.
// The node tests (tests/unit) have no window, and need none of it.
if (typeof window !== 'undefined') {
	if (!window.matchMedia)
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
	for (const name of ['ResizeObserver', 'IntersectionObserver'])
		if (!(name in window))
			(window as unknown as Record<string, unknown>)[name] = class {
				observe() {}
				unobserve() {}
				disconnect() {}
				takeRecords() {
					return [];
				}
			};
	if (!Element.prototype.animate)
		Element.prototype.animate = function () {
			return {
				cancel() {},
				finish() {},
				play() {},
				pause() {},
				finished: Promise.resolve(),
				onfinish: null,
				addEventListener() {},
				removeEventListener() {}
			} as unknown as Animation;
		};
	if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
}
