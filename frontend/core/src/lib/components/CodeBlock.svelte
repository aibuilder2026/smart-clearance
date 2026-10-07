<script lang="ts">
	import { cx } from '../cx';

	type Props = {
		code: string;
		class?: string;
		/** what the region is called; the code's first line otherwise */
		label?: string;
	};
	let { code, class: className, label }: Props = $props();

	// the kit's CodeBlock, the JSON card: the code escaped, then its request lines, keys, strings and numbers marked for
	// colour; a region the keyboard can scroll
	const html = $derived(
		code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/^(POST|GET|PUT|PATCH|DELETE|HTTP\/\d\.\d|\d{3})\b[^\n]*/gm, (m) => `<span class="m">${m}</span>`)
			.replace(/("[^"\n]*")(\s*:)/g, '<span class="k">$1</span>$2')
			.replace(/:\s*("[^"\n]*")/g, (m, s: string) => m.replace(s, `<span class="s">${s}</span>`))
			.replace(/(:\s*)(-?\d+(?:\.\d+)?)/g, '$1<span class="n">$2</span>')
	);
	const first = $derived(code.split('\n')[0].trim());
</script>

<!-- eslint-disable svelte/no-at-html-tags -- the code is escaped first; the only markup is the spans that colour it -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex (the region scrolls, so the keyboard must reach it) -->
<pre
	class={cx('code', className)}
	tabindex="0"
	role="region"
	aria-label={label || (/\w/.test(first) ? first : 'Code')}>{@html html}</pre>
<!-- eslint-enable svelte/no-at-html-tags -->
