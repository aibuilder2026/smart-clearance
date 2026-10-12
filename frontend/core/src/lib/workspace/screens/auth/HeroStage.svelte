<script lang="ts">
	import Mark from '../../../components/Mark.svelte';
	import Wordmark from '../../../components/Wordmark.svelte';
	import { useWorkspace } from '../../source';

	// the stage beside the sign-in form on desktops (SC-195, option A, In focus; screens/auth.jsx HeroStage). One
	// photograph is the sign-in's ground (.si-photo, the sign-in sets it): the client's packs crisp on a kirana counter,
	// the shop and the lane soft behind them, under the frosted card. The stage keeps the product's mark and its line in
	// glass, and names what is in focus. It settles once and holds (WCAG 2.2.2), at once under reduced motion
	const ws = useWorkspace();
	const W = $derived(ws.publicInfo?.workspace ?? ws.data.workspace);
</script>

<div class="si-stage si-focus">
	<div class="si-brand rise">
		<div class="si-product"><Mark size={34} /><Wordmark size={20} /></div>
		<p class="si-tagline">
			Every near-expiry carton gets a second chance, chosen by AI. <span class="hi" lang="hi"
				>हर कार्टन को दूसरा मौका</span
			>
		</p>
	</div>
	<span class="si-caption rise late"
		><span class="dot" aria-hidden="true"></span>{W.short}'s packs, on a kirana counter</span
	>
</div>

<style>
	/* the glass and the caption rise into place once (design3 does it with framer-motion: 420 ms, after 250 and 550 ms) */
	.rise {
		animation: rise 420ms cubic-bezier(0.22, 1, 0.36, 1) 250ms backwards;
	}
	.rise.late {
		animation-delay: 550ms;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rise {
			animation: none;
		}
	}
</style>
