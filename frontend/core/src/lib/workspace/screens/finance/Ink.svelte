<script lang="ts">
	import InkStrokes from '../../../components/InkStrokes.svelte';
	import { cx } from '../../../cx';
	import type { Ink } from '../../types';
	import { sealUrl, signUrl } from '../../marks';

	// a signature (SC-174, option A; screens/finance.jsx Ink): the signatory's specimen signature in ink, over the firm's
	// rubber stamp (a distributor's rectangle, the signature between its lines) or beside its round seal (a company's, an
	// agency's), from design3's signature maker. A name with no specimen on file (a witness he named who is not on the
	// agency's panel) signs on the agency's original, and the paper says so. A signature signed in place at the facility
	// (SC-183) is its own ink, drawn as signed (`play`), or the name typed; the seal goes beside it as beside a specimen
	let {
		who,
		seal = null,
		stamp = 'round',
		h = 46,
		play = false,
		delay = 0
	}: {
		who: { name: string; sign?: string | null; ink?: Ink | null } | null | undefined;
		seal?: string | null;
		stamp?: 'round' | 'rect';
		h?: number;
		play?: boolean;
		delay?: number;
	} = $props();
</script>

{#if who}{#if who.ink}<span class={cx('sig-ink', seal && 'sealed', stamp)} style="--h: {h}px"
			>{#if seal}<img class="sig-seal" src={sealUrl(seal)} alt="" aria-hidden="true" />{/if}<InkStrokes
				class="sig-hand"
				ink={who.ink}
				name={who.name}
				{h}
				{play}
				{delay}
			/></span
		>{:else if !who.sign}<span class="sig-none">signed on the agency's original</span>{:else}<span
			class={cx('sig-ink', seal && 'sealed', stamp)}
			style="--h: {h}px"
			>{#if seal}<img class="sig-seal" src={sealUrl(seal)} alt="" aria-hidden="true" />{/if}<img
				class="sig-hand"
				src={signUrl(who.sign)}
				alt="Signed by {who.name}"
			/></span
		>{/if}{/if}
