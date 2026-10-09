/**
 * The first paint (SC-131). A cover (the console's splash, the landing page's loader) goes first in <body> and brings
 * its own styles, so the page's stylesheets need not hold back the first paint while it is up: on a slow line the cover
 * is on screen with the page's first bytes, not once the stylesheets have arrived. Each stylesheet the page links is
 * fetched as a preload (at the highest priority, without blocking) and becomes a stylesheet once it has loaded, with a
 * <noscript> copy for a browser without scripts; the cover opens only once they are all in. `preconnect` opens the
 * connection to an API (DNS, TCP and TLS) while the page's code is still arriving.
 */
export function firstPaint(html: string, opts: { cover: string; preconnect?: string | null }): string {
	const sheets: string[] = [];
	let out = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
		if (/\bmedia=/.test(tag)) return tag;
		sheets.push(tag);
		return tag.replace('rel="stylesheet"', `rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"`);
	});
	const head = [
		opts.preconnect ? `<link rel="preconnect" href="${new URL(opts.preconnect).origin}" crossorigin>` : '',
		sheets.length ? `<noscript>${sheets.join('')}</noscript>` : ''
	].join('');
	// after the charset, which must come first, or else at the top of the head
	if (head)
		out = /<meta charset[^>]*>/.test(out)
			? out.replace(/<meta charset[^>]*>/, (tag) => tag + head)
			: out.replace(/<head[^>]*>/, (tag) => tag + head);
	return out.replace(/<body[^>]*>/, (body) => body + opts.cover);
}
