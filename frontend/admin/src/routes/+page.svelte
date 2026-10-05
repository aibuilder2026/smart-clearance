<script lang="ts">
	import '#lib/landing/site.css';
	import { AppRoot } from '@smart-clearance/core';
	import { createQuery } from '@tanstack/svelte-query';
	import { catalogQuery, showcaseQuery } from '#lib/api/queries.ts';
	import { PLATES } from '#lib/landing/plates.ts';
	import Site from '#lib/landing/Site.svelte';

	const showcase = createQuery(() => showcaseQuery());
	const catalog = createQuery(() => catalogQuery());

	const SITE = 'https://smartclearance.com';
	const description =
		'AI agents find the best exit for near-expiry stock, and a person says yes once. Smart-Clearance routes short-dated FMCG stock to kiranas, marketplaces, staff sales and food banks before it reaches the bin.';
</script>

<svelte:head>
	<title>Smart-Clearance</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="{SITE}/" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Smart-Clearance" />
	<meta property="og:title" content="Smart-Clearance · every near-expiry carton gets a second chance" />
	<meta property="og:description" content={description} />
	<meta property="og:url" content="{SITE}/" />
	<meta property="og:image" content="{SITE}{PLATES.town.day}" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<AppRoot scroll="window" class="site-root">
	{#if showcase.data && catalog.data}
		<Site showcase={showcase.data} catalog={catalog.data} />
	{:else if showcase.isError || catalog.isError}
		<p class="t-callout" role="alert" style="padding: 48px 16px; text-align: center">
			Smart-Clearance could not load this page's figures. Reload to try again.
		</p>
	{/if}
</AppRoot>
