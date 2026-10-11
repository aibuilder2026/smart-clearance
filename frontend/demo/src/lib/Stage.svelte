<script lang="ts">
	import ConsoleDevice from './ConsoleDevice.svelte';
	import ConsoleScreen from './ConsoleScreen.svelte';
	import Device from './Device.svelte';
	import { specsOf } from './people.ts';
	import type { Player } from './player.svelte.ts';

	// the stage (director.jsx Stage): the beat's laptop and phone fitted into their box, the console's laptop alone and
	// wider, the phone alone (P), or on a real phone the person in focus full screen
	type Props = { p: Player; w: number; h: number; phoneOnly?: boolean; real?: boolean };
	let { p, w, h, phoneOnly, real }: Props = $props();

	const sp = $derived(specsOf(p.station, p.beat));
	const time = $derived(p.beat.time || '09:00');
	const date = $derived(p.beat.date || p.station.date);
	const focus = $derived(p.complete ? null : p.beat.focus);
	const labelH = 50;
	const fit = $derived.by(() => {
		const ps = Math.min(0.84, Math.max(0.3, (h - labelH - 8) / 868));
		const winW = p.act.console ? 1440 : 1280;
		const avail = w - (sp.phone && !p.act.console ? 414 * ps + 40 : 0);
		const sw = p.act.console
			? Math.min(1, Math.max(0.3, Math.min((w - 8) / winW, (h - labelH - 8) / 860)))
			: Math.min(1, Math.max(0.3, avail / winW));
		return { ps, winW, sw, winH: Math.max(p.act.console ? 720 : 640, (h - labelH - 8) / sw) };
	});
	const solo = $derived(focus === 'desk' ? sp.desk : sp.phone || sp.desk);
</script>

{#if real}
	{#if p.act.console}<div class="real-console"><ConsoleScreen spec={sp.desk} /></div>{:else}<Device
			kind="bare"
			spec={solo}
			{time}
			{date}
			ontap={p.tap}
		/>{/if}
{:else if w > 0 && h > 0}
	<div class="devices">
		{#if p.act.console}
			<ConsoleDevice spec={sp.desk} width={fit.winW} height={fit.winH} scale={fit.sw} />
		{:else if phoneOnly}
			<Device
				kind="phone"
				spec={solo}
				{time}
				{date}
				scale={Math.min(1.04, fit.ps * 1.18)}
				focus={!!focus}
				amber={p.beat.human}
				ontap={p.tap}
			/>
		{:else}
			<Device
				kind="desk"
				spec={sp.desk}
				{time}
				{date}
				scale={fit.sw}
				width={fit.winW}
				height={fit.winH}
				focus={focus === 'desk'}
				amber={focus === 'desk' && p.beat.human}
				ontap={p.tap}
			/>
			{#if sp.phone}<Device
					kind="phone"
					spec={sp.phone}
					{time}
					{date}
					scale={fit.ps}
					focus={focus === 'phone'}
					amber={focus === 'phone' && p.beat.human}
					ontap={p.tap}
				/>{/if}
		{/if}
	</div>
{/if}
