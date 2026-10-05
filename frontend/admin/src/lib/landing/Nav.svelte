<script lang="ts">
	import { Button, Icon, IconButton, Mark, Menu, ModeMenuButton, Sheet, Wordmark } from '@smart-clearance/core';
	import { LINKS, SECTIONS, goTo } from './links';

	let { onfind, ondemo }: { onfind: () => void; ondemo: () => void } = $props();
	let menu = $state(false);
	let sheet = $state(false);
</script>

{#snippet staffMark()}<span class="t-caption subtle mono">munchly</span>{/snippet}

<!-- the bar: the product, its sections, the ways in. The sections show on desktops and Book a demo beside them; a phone
     gets a menu button instead (base.css's .desk-only, .not-phone and .phone-only, so the server renders every width) -->
<header class="site-nav">
	<a class="nav-brand" href="#top" aria-label="Smart-Clearance, back to the top"
		><span class="nav-mark"><Mark size={36} /></span><Wordmark size={15} /></a
	>
	<nav class="nav-links desk-only" aria-label="Sections">
		{#each SECTIONS as [id, t] (id)}<a href="#{id}">{t}</a>{/each}
	</nav>
	<span class="grow"></span>
	<span class="nav-mode"><ModeMenuButton /></span>
	<span class="nav-signin"
		><Menu
			bind:open={menu}
			width={268}
			label="Sign in to"
			items={[
				{ label: 'Sign in to', heading: true },
				{ label: 'Find your workspace', icon: 'search', onclick: onfind },
				{ label: 'Munchly Foods', icon: 'building-2', right: staffMark, href: LINKS.app },
				'-',
				{ label: 'Smart-Clearance staff', icon: 'shield', href: LINKS.console }
			]}
		>
			{#snippet trigger(props)}<button {...props} type="button" class="nav-text">Sign in</button>{/snippet}
		</Menu></span
	>
	<Button variant="primary" pill class="nav-demo not-phone" onclick={() => ondemo()}>Book a demo</Button><IconButton
		icon="menu"
		label="Menu"
		class="phone-only"
		onclick={() => (sheet = true)}
	/>
	<Sheet bind:open={sheet} title="Smart-Clearance" side="bottom" detent="medium">
		<div class="stack">
			<div class="list">
				{#each SECTIONS as [id, t] (id)}<button
						type="button"
						class="list-row"
						onclick={() => {
							sheet = false;
							setTimeout(() => goTo(id), 60);
						}}
						><span class="lr-main"><span class="lr-title">{t}</span></span><Icon
							name="chevron-right"
							size={18}
							class="chev"
						/></button
					>{/each}
			</div>
			<Button
				variant="primary"
				size="lg"
				block
				onclick={() => {
					sheet = false;
					ondemo();
				}}>Book a demo</Button
			>
		</div>
	</Sheet>
</header>
