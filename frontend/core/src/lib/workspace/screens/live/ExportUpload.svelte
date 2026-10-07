<script lang="ts">
	import Button from '../../../components/Button.svelte';
	import Card from '../../../components/Card.svelte';
	import Progress from '../../../components/Progress.svelte';
	import { fmt } from '../../../format';
	import Icon from '../../../icons/Icon.svelte';

	// Setup's stock export on its way (screens/live.jsx ExportUpload, SC-68 option B): the file, how far it has gone, and
	// what happens to it next; the rules below stay to hand while it goes
	type Props = { name: string; size: number; p: number; oncancel?: () => void };
	let { name, size, p, oncancel }: Props = $props();
	const mb = (n: number) => (n / 1e6).toFixed(1);
	const steps: [string, string][] = [
		['Upload', 'now'],
		['Map columns', 'Data Agent'],
		['Load into BigQuery', 'then the Watcher starts']
	];
</script>

<Card class="stack snug lv-upload">
	<div class="card-head">
		<span class="row tight" style="min-width: 0"
			><span class="icontile"><Icon name="file-spreadsheet" size={17} stroke={2} /></span><span
				class="stack tight"
				style="gap: 0; min-width: 0"
				><b style="overflow-wrap: anywhere">{name}</b><span class="t-footnote subtle"
					>DMS export · {fmt.num(Number(mb(size)))} MB</span
				></span
			></span
		>{#if oncancel}<Button variant="ghost" size="sm" onclick={oncancel}>Cancel</Button>{/if}
	</div>
	<Progress value={p} label="Uploading the DMS export" />
	<span class="row between t-footnote subtle"
		><span class="tnum">Uploading · {mb(size * p)} of {mb(size)} MB</span><span class="tnum"
			>{Math.round(p * 100)}%</span
		></span
	>
	<ol class="lv-mini" aria-label="What happens to the file">
		{#each steps as [t, sub], i (t)}<li class={i === 0 ? 'now' : undefined}>
				<i aria-hidden="true"></i><b>{t}</b><span>{sub}</span>
			</li>{/each}
	</ol>
	<span class="t-footnote muted"
		>You can keep setting the rules below while it uploads. The column mapping appears here when the Data Agent has read
		the file.</span
	>
</Card>
