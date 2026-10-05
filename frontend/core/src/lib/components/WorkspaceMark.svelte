<script lang="ts">
	import { cx } from '../cx';

	export type Workspace = { id: string; name: string; mark?: { from: string; to: string; ink: string } };

	// a workspace's mark keeps the client's own colours inside the tile and nowhere else. Munchly's is its m with a bite
	// taken out of the corner; a workspace without artwork gets its initial on its colour.
	let {
		ws,
		size = 32,
		class: className,
		label
	}: { ws: Workspace; size?: number; class?: string; label?: string } = $props();
	const uid = $props.id();
	const gid = 'wm' + uid;
	const c = $derived(ws.mark ?? { from: '#5f6e67', to: '#45554d', ink: '#ffffff' });
	const munchly = $derived(ws.id === 'munchly');
</script>

<svg
	class={cx('wsmark', className)}
	width={size}
	height={size}
	viewBox="0 0 64 64"
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	><defs
		><linearGradient id="{gid}g" x1="6" y1="2" x2="58" y2="62" gradientUnits="userSpaceOnUse"
			><stop offset="0" stop-color={c.from} /><stop offset="1" stop-color={c.to} /></linearGradient
		>{#if munchly}<mask id="{gid}m"
				><rect width="64" height="64" fill="#fff" /><circle cx="59" cy="5" r="9" fill="#000" /><circle
					cx="47"
					cy="2.5"
					r="5.5"
					fill="#000"
				/><circle cx="61.5" cy="17" r="5.5" fill="#000" /></mask
			>{/if}</defs
	><path
		d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z"
		fill="url(#{gid}g)"
		mask={munchly ? `url(#${gid}m)` : undefined}
	/>{#if munchly}<path
			d="M18 45V33.5a7 7 0 0 1 14 0V45M32 33.5a7 7 0 0 1 14 0V45"
			fill="none"
			stroke={c.ink}
			stroke-width="6.6"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>{:else}<text x="32" y="43" text-anchor="middle" fill={c.ink} style="font: 700 30px var(--font-ui)"
			>{(ws.name || '?').slice(0, 1)}</text
		>{/if}</svg
>
