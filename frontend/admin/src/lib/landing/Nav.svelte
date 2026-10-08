<script lang="ts">
	import {
		Button,
		Icon,
		IconButton,
		Mark,
		Menu,
		ModeMenuButton,
		Sheet,
		Wordmark,
		cx,
		prefersReducedMotion
	} from '@smart-clearance/core';
	import { LINKS, SECTIONS, goTo } from './links';

	let { onfind, ondemo }: { onfind: () => void; ondemo: () => void } = $props();
	let menu = $state(false);
	let sheet = $state(false);

	// The bar (SC-78): the brand, the links centred with a dot under the section the reader is in, the actions; clear
	// over the film, its glass once the page has scrolled, with a progress line along its foot. The section the reader
	// is in is the last one whose top has passed 45% of the window (design3's useActiveSection); the progress is how
	// far the page has scrolled. One listener, one frame a scroll.
	let active: string | null = $state(null);
	let progress = $state(0);
	$effect(() => {
		let raf = 0;
		const measure = () => {
			raf = 0;
			const line = innerHeight * 0.45;
			let cur: string | null = null;
			for (const [id] of SECTIONS) {
				const el = document.getElementById(id);
				if (el && el.getBoundingClientRect().top <= line) cur = id;
			}
			active = cur;
			const room = document.documentElement.scrollHeight - innerHeight;
			progress = room > 0 ? Math.min(1, Math.max(0, scrollY / room)) : 0;
		};
		const onscroll = () => {
			if (!raf) raf = requestAnimationFrame(measure);
		};
		measure();
		addEventListener('scroll', onscroll, { passive: true });
		addEventListener('resize', onscroll);
		return () => {
			cancelAnimationFrame(raf);
			removeEventListener('scroll', onscroll);
			removeEventListener('resize', onscroll);
		};
	});
</script>

<!-- the sections show on desktops and Book a demo beside them; a phone gets a menu button instead (base.css's
     .desk-only, .not-phone and .phone-only, so the server renders every width) -->
<header class="site-nav">
	<div class="nav-in">
		<a class="nav-brand" href="#top" aria-label="Smart-Clearance, back to the top"
			><span class="nav-mark"><Mark size={30} /></span><Wordmark size={16} /></a
		>
		<nav class="nav-links desk-only" aria-label="Sections">
			{#each SECTIONS as [id, t] (id)}<a
					href="#{id}"
					class={cx(active === id && 'on')}
					aria-current={active === id ? 'location' : undefined}><span class="nav-t">{t}</span></a
				>{/each}
		</nav>
		<span class="nav-actions">
			<span class="nav-mode"><ModeMenuButton /></span>
			<span class="nav-signin"
				><Menu
					bind:open={menu}
					width={268}
					label="Sign in to"
					items={[
						{ label: 'Sign in to', heading: true },
						{ label: 'Find your workspace', icon: 'search', onclick: onfind },
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
		</span>
	</div>
	<span class="nav-progress" aria-hidden="true" style="transform: scaleX({prefersReducedMotion.current ? 0 : progress})"
	></span>
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
