<script lang="ts" module>
	import type { SignatureRole } from '../../types';

	/** one of the certificate's four signers, as the sheet shows them: their place, name, what they are, and the
	 *  sentence they sign to (its figures in bold) */
	export type Signer = {
		role: SignatureRole;
		n: number;
		label: string;
		name: string;
		sub: string;
		decl: [string, string, string];
	};
	/** what a signature comes back as: the strokes in the pad's box, or typed */
	export type Signed = { typed: true } | { typed?: false; box: [number, number]; strokes: [number, number][][] };
</script>

<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Field from '../../../components/Field.svelte';
	import Input from '../../../components/Input.svelte';
	import Sheet from '../../../components/Sheet.svelte';
	import SignPad, { type PadInk } from '../../../components/SignPad.svelte';
	import Icon from '../../../icons/Icon.svelte';

	// the sheet a signature is drawn in (SC-183, option B; screens/trade.jsx SignSheet): who signs, the sentence they sign
	// to, the pad (or the name typed, the keyboard's way and anyone's who cannot draw on glass), and Sign
	let { who, onclose, onsign }: { who: Signer | null; onclose: () => void; onsign: (s: Signed) => void } = $props();
	let ink = $state<PadInk | null>(null);
	let typed = $state(false);
	let text = $state('');
	let open = $state(false);
	$effect(() => {
		open = !!who;
		// a new signer starts on a clean pad
		void who?.role;
		ink = null;
		typed = false;
		text = '';
	});
	const ok = $derived(
		!!who && (typed ? text.trim().toLowerCase() === who.name.toLowerCase() : !!ink && ink.strokes.length > 0)
	);
	// the button names them by their first name, past an initial (M. Srinivas Reddy signs as Srinivas)
	const first = $derived(who ? (who.name.split(' ').find((w) => w.replace('.', '').length > 1) ?? who.name) : '');
	const initials = $derived(
		who
			? who.name
					.split(' ')
					.map((x) => x[0])
					.join('')
					.slice(0, 2)
			: ''
	);
</script>

{#snippet footer()}<div class="dz-foot">
		<Button variant="secondary" size="lg" onclick={onclose}>Cancel</Button><Button
			variant="primary"
			size="lg"
			block
			icon="signature"
			disabled={!ok}
			aria-describedby="dz-sign-how"
			onclick={() => onsign(typed ? { typed: true } : { box: ink!.box, strokes: ink!.strokes })}>Sign as {first}</Button
		>
	</div>{/snippet}

<Sheet bind:open title={who ? `${who.name} signs` : ''} {onclose} footer={who ? footer : undefined}>
	{#if who}<div class="stack" style="gap: 14px">
			<div class="row" style="gap: 10px">
				<span class="dz-avatar" aria-hidden="true">{initials}</span>
				<div class="grow">
					<b>{who.label}</b>
					<div class="t-footnote muted">{who.sub}</div>
				</div>
			</div>
			{#if who.role !== 'handed'}<span class="row tight t-footnote muted" style="gap: 6px"
					><Icon name="hand" size={14} />Hand the device to {who.name}</span
				>{/if}
			<div class="dz-decl">{who.decl[0]}<b>{who.decl[1]}</b>{who.decl[2]}</div>
			{#if typed}<Field
					label={`Type your name: ${who.name}`}
					htmlFor="dz-typed"
					help="The certificate marks the signature as typed"
					><Input id="dz-typed" bind:value={text} autocomplete="off" spellcheck={false} /></Field
				>{:else}<SignPad name={who.name} value={ink} onchange={(v) => (ink = v)} />{/if}
			<div class="row between wrap" style="gap: 8px">
				<span id="dz-sign-how" class="t-caption subtle"
					>{typed
						? 'Typed, it goes on the certificate as the name, marked typed, with the time.'
						: 'Sign with a finger, a stylus or a mouse. It goes on the certificate as drawn, with the time.'}</span
				>
				<button type="button" class="pt-link t-footnote" onclick={() => (typed = !typed)}
					>{typed ? 'Draw the signature instead' : 'Type the name instead'}</button
				>
			</div>
		</div>{/if}
</Sheet>
