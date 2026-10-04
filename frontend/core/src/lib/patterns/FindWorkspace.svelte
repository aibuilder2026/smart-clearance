<script lang="ts" module>
	import type { Workspace } from '../components/WorkspaceMark.svelte';

	/** a workspace someone can sign in to, and how they belong to it ("operator", "invited as retailer" …) */
	export type WorkspaceMatch = { workspace: Workspace & { domain: string }; as: string; value: string };
</script>

<script lang="ts">
	import { useApp } from '../app.svelte';
	import Button from '../components/Button.svelte';
	import Field from '../components/Field.svelte';
	import Input from '../components/Input.svelte';
	import Mark from '../components/Mark.svelte';
	import Sheet from '../components/Sheet.svelte';
	import Wordmark from '../components/Wordmark.svelte';
	import WorkspaceMark from '../components/WorkspaceMark.svelte';
	import { digits, isEmail } from '../identity';

	type Props = {
		open?: boolean;
		onclose?: () => void;
		/** open the workspace for this email or number */
		onuse: (value: string) => void;
		/** looks the email or number up across every workspace on the platform */
		find: (value: string) => Promise<WorkspaceMatch[]>;
		/** the platform's own address, shown beside its name */
		domain: string;
		initial?: string;
		/** a line under the results (the prototype: "Only Munchly Foods is set up in this prototype.") */
		note?: string;
	};
	let { open = $bindable(false), onclose, onuse, find, domain, initial = '', note }: Props = $props();

	// Find your workspace: one Smart-Clearance step above every client (screens/auth.jsx)
	const app = useApp();
	let value = $state('');
	let results: WorkspaceMatch[] | null = $state(null);
	let error = $state('');
	let busy = $state(false);

	$effect.pre(() => {
		if (open) {
			value = initial;
			results = null;
			error = '';
		}
	});

	async function search() {
		const t = value.trim();
		error = '';
		results = null;
		if (!t) return void (error = 'Enter an email address or a mobile number.');
		if (!isEmail(t) && digits(t).length !== 10)
			return void (error = 'Enter an email address, or a 10-digit mobile number.');
		busy = true;
		try {
			results = await find(t);
		} finally {
			busy = false;
		}
	}
</script>

<Sheet bind:open {onclose} title="Find your workspace" side={app.bp === 'phone' ? 'bottom' : 'center'} detent="large">
	{#snippet footer()}<Button variant="primary" size="lg" block loading={busy} onclick={search}>Find workspaces</Button
		>{/snippet}
	<div class="stack">
		<div class="row tight">
			<Mark size={28} /><Wordmark size={17} /><span class="t-caption subtle mono">{domain}</span>
		</div>
		<p class="t-subhead muted" style="margin: 0">
			Every manufacturer on Smart-Clearance has its own workspace, set up for its supply chain. Enter the email or
			mobile number you were invited with.
		</p>
		<Field label="Email or mobile number" htmlFor="fw-id" {error}
			><Input
				id="fw-id"
				bind:value
				oninput={() => {
					error = '';
					results = null;
				}}
				onkeydown={(e) => e.key === 'Enter' && search()}
				autocomplete="username"
				placeholder="name@company.in or 98230 44118"
			/></Field
		>
		{#if results}
			{#if results.length}
				<div class="stack tight">
					<span class="t-caption subtle strong"
						>{results.length === 1 ? '1 workspace' : results.length + ' workspaces'}</span
					>
					{#each results as r (r.value + r.workspace.id)}
						<div class="card row" style="gap: 12px; padding: 12px 14px">
							<WorkspaceMark ws={r.workspace} size={40} /><span class="stack tight grow" style="gap: 1px; min-width: 0"
								><b>{r.workspace.name}</b><span class="t-caption subtle mono" style="overflow-wrap: anywhere"
									>{r.workspace.domain}</span
								><span class="t-footnote muted">{r.as}</span></span
							><Button variant="secondary" size="sm" onclick={() => onuse(r.value)}>Open</Button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="card stack tight" style="padding: 14px 16px">
					<b>No workspace uses that yet</b><span class="t-footnote muted"
						>Ask your company's admin to invite you. If your company is setting up Smart-Clearance, its workspace
						appears here once it is live.</span
					>
				</div>
			{/if}
		{/if}
		{#if note}<p class="t-caption subtle" style="margin: 0">{note}</p>{/if}
	</div>
</Sheet>
