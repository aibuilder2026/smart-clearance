<script lang="ts">
	import { Button, Field, Icon, Input, Select, Sheet, Textarea, useApp } from '@smart-clearance/core';
	import { createMutation } from '@tanstack/svelte-query';
	import { api, usingMock } from '#lib/api/client.ts';
	import { ApiError, demoRequestErrors, type DemoRequest, type DemoRequestInput } from '@smart-clearance/api/site';
	import { LINKS, linkProps } from './links';

	let { open = $bindable(false), plan = null }: { open?: boolean; plan?: string | null } = $props();
	const app = useApp();

	// book a demo: the request lands in the console (in this prototype, in this browser's store: see the mock)
	const MAKES = ['Snacks and drinks', 'Personal care', 'Dairy', 'Staples', 'Home care'];
	const blank = () => ({ name: '', company: '', email: '', makes: MAKES[0], note: '' });
	let f = $state(blank());
	let err: Record<string, string> = $state({});
	let sent: DemoRequest | null = $state(null);
	const send = createMutation(() => ({ mutationFn: (input: DemoRequestInput) => api.requestDemo(input) }));

	$effect.pre(() => {
		if (open) {
			sent = null;
			err = {};
		}
	});

	// each problem is said under its own field, and the first of them takes focus
	const showErrors = (e: Record<string, string>) => {
		err = e;
		const first = ['name', 'company', 'email'].find((k) => e[k]);
		if (first) document.getElementById('bd-' + first)?.focus();
	};
	const edit = (k: string) => () => {
		if (err[k]) err = { ...err, [k]: '' };
	};

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const input: DemoRequestInput = { ...f, plan };
		const problems = demoRequestErrors(input);
		if (Object.keys(problems).length) return showErrors(problems);
		try {
			sent = await send.mutateAsync(input);
			f = blank();
		} catch (x) {
			if (x instanceof ApiError && Object.keys(x.fields).length) showErrors(x.fields);
			else err = { form: 'The request did not go through. Try again in a moment.' };
		}
	}
</script>

<Sheet
	bind:open
	title={plan ? `Talk to us about ${plan}` : 'Book a demo'}
	side={app.bp === 'phone' ? 'bottom' : 'center'}
	detent="large"
>
	{#snippet footer()}{#if sent}<Button variant="primary" size="lg" block onclick={() => (open = false)}>Done</Button
			>{:else}<Button
				variant="primary"
				size="lg"
				block
				icon="send"
				type="submit"
				form="bd-form"
				loading={send.isPending}>Send request</Button
			>{/if}{/snippet}
	{#if sent}
		<div class="stack" style="justify-items: center; text-align: center; padding-top: 8px">
			<span class="sd-done" aria-hidden="true"><Icon name="circle-check" size={36} /></span>
			<b class="t-title3">Thanks, {sent.name.split(' ')[0]}.</b>
			<p class="t-subhead muted" style="margin: 0; max-width: 40ch">
				We'll set up a walkthrough for {sent.company} on its own supply chain. In this prototype your request appears in the
				Smart-Clearance console, under Overview.
			</p>
			<a class="btn btn-link" {...linkProps(LINKS.console)}>Open the console</a>
		</div>
	{:else}
		<form id="bd-form" class="stack" style="gap: 12px" onsubmit={submit} novalidate>
			<p class="t-subhead muted" style="margin: 0">
				Thirty minutes on your own stock: we price one batch that's headed for the bin and show you the plan.
			</p>
			<Field label="Your name" htmlFor="bd-name" error={err.name || null}
				><Input id="bd-name" bind:value={f.name} oninput={edit('name')} autocomplete="name" /></Field
			>
			<Field label="Company" htmlFor="bd-company" error={err.company || null}
				><Input id="bd-company" bind:value={f.company} oninput={edit('company')} autocomplete="organization" /></Field
			>
			<Field label="Work email" htmlFor="bd-email" error={err.email || null}
				><Input
					id="bd-email"
					type="email"
					bind:value={f.email}
					oninput={edit('email')}
					autocomplete="email"
					spellcheck={false}
					autocapitalize="none"
				/></Field
			>
			<Field label="What you make" htmlFor="bd-makes"
				><Select id="bd-makes" bind:value={f.makes}
					>{#each MAKES as x (x)}<option>{x}</option>{/each}</Select
				></Field
			>
			<Field label="Anything we should know (optional)" htmlFor="bd-note"
				><Textarea id="bd-note" rows={3} bind:value={f.note} /></Field
			>
			{#if err.form}<p class="t-footnote neg" role="alert" style="margin: 0">{err.form}</p>{/if}
			{#if usingMock}<p class="t-footnote subtle" style="margin: 0">
					Prototype: nothing is sent anywhere; the request stays in this browser.
				</p>{/if}
		</form>
	{/if}
</Sheet>
