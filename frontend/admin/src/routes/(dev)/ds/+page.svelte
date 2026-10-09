<script lang="ts">
	import '#lib/ds/docs.css';
	import {
		AppRoot,
		Aura,
		Avatar,
		Badge,
		Button,
		Card,
		Check,
		Chip,
		DaysNum,
		Field,
		GateChips,
		ICONS,
		Icon,
		IconButton,
		Input,
		Kbd,
		List,
		ListRow,
		Mark,
		Money,
		OTP,
		PoweredBy,
		Product,
		SearchField,
		Segmented,
		Select,
		Splash,
		Stepper,
		Switch,
		Tabs,
		Textarea,
		WindowFrame,
		Wordmark,
		WorkspaceMark,
		cx,
		fmt,
		useTheme,
		type IconName,
		type ThemeMode
	} from '@smart-clearance/core';
	import ds from '#lib/seed/ds.json';
	import Edition from '#lib/ds/Edition.svelte';
	import Later from '#lib/ds/Later.svelte';
	import MarkPlayer from '#lib/ds/MarkPlayer.svelte';
	import OverlaysDemo from '#lib/ds/OverlaysDemo.svelte';
	import Sec from '#lib/ds/Sec.svelte';
	import Spec from '#lib/ds/Spec.svelte';

	// design system v3 in core, laid out as the prototype's design system page (design3/system/ds.jsx, the hosted DS v3
	// page), with the same section ids: every piece core has built, and a card for each piece still to come
	const theme = useTheme();
	const F = ds.figures;
	const WS = ds.workspace;

	const TOC: [string, string | null][] = [
		['Foundations', null],
		['The world', 'world'],
		['Mark and splash', 'mark'],
		['Client workspace', 'workspace'],
		['Colour', 'colour'],
		['Type and numerals', 'type'],
		['Shape, depth, materials', 'shape'],
		['Motion', 'motion'],
		['Icons', 'icons'],
		['Imagery', 'imagery'],
		['Components', null],
		['Buttons and badges', 'buttons'],
		['Cards and lists', 'cards'],
		['Navigation', 'nav'],
		['Controls', 'controls'],
		['Data and tables', 'data'],
		['Sheets, alerts, pushes', 'overlays'],
		['The tracker', 'tracker'],
		['Agents at work', 'agents'],
		['Map and charts', 'charts'],
		['Feedback', 'feedback'],
		['Screen patterns', 'patterns']
	];
	const LIGHT: [string, string, string][] = [
		['--bg', '#f2f6f3', 'Ground'],
		['--surface', '#ffffff', 'Card'],
		['--fg', '#0d1c15', 'Ink'],
		['--fg-2', '#45554d', 'Ink 2'],
		['--fg-3', '#5f6e67', 'Ink 3'],
		['--primary', '#167a52', 'Green, the agent and primary'],
		['--amber', '#f2b437', 'Amber, the human yes'],
		['--red', '#e5484d', 'Red, risk only'],
		['--violet', '#6e56cf', 'Violet, ExpireSoon only'],
		['--blue', '#0a7ae0', 'Blue, pushes and info']
	];
	const DARK: [string, string, string][] = [
		['--bg', '#070b09', 'Ground'],
		['--surface', '#101613', 'Card'],
		['--fg', '#ecf2ee', 'Ink'],
		['--fg-2', '#a7b4ad', 'Ink 2'],
		['--fg-3', '#82908a', 'Ink 3'],
		['--primary', '#3ccb8a', 'Green'],
		['--amber', '#f7c04a', 'Amber'],
		['--red', '#ec5d5e', 'Red'],
		['--violet', '#8b74f0', 'Violet'],
		['--blue', '#3b9eff', 'Blue']
	];
	const WORLD: [IconName, string, string][] = [
		[
			'route',
			'A batch is an order',
			'Status in a giant numeral, an ETA chip, a nine-stop tracker from Connect to Report, a map with the godown and the van.'
		],
		[
			'circle-dot',
			'Colour only where something is live',
			'Resting rows stay neutral. Red marks risk, amber marks the one human yes, violet belongs to ExpireSoon alone.'
		],
		[
			'indian-rupee',
			'Numbers carry the money',
			'Heavy Bricolage numerals with the rupee sign and paise set small, in the Monzo manner; they roll in place when an agent changes them.'
		],
		[
			'sparkles',
			'Agents glow while they work',
			'A mint-to-sky aura turns around the agent that is working and stops the moment it hands off.'
		],
		[
			'smartphone',
			'PWA first',
			'A tab bar on phones, a rail on tablets, a sidebar on desktops; sheets with detents; safe areas honoured; light and dark composed separately.'
		]
	];
	const ROLES: [string, string, string][] = [
		['Large title · 36', 't-large', 'Command Center'],
		['Title 1 · 30', 't-title1', 'Route Room'],
		['Title 2 · 24', 't-title2', 'Five channels, priced'],
		['Title 3 · 20', 't-title3', 'Recommended split'],
		['Headline · 17', 't-headline', 'Masala Chips 150 g'],
		['Body · 15', 't-body', 'Nothing is listed, messaged or shipped before your tap.'],
		['Subhead · 14', 't-subhead muted', 'Rakesh Traders · Kalamna Market godown, Nagpur'],
		['Footnote · 13', 't-footnote subtle', 'Synthetic demo data · disposal, EPR and CO₂e are indicative'],
		['Mono · ids and JSON', 'mono', 'MF-2409-117 · POST /v1/listings · 201'],
		['Devanagari', 'hi t-callout', 'आज का खास ऑफर: 10 पैकेट लो, 2 मुफ़्त']
	];
	const RENDERS = [
		'carton-hero',
		'pack-chips',
		'pack-biscuits',
		'pack-chikki',
		'pack-poha',
		'pack-oats',
		'pack-mango',
		'pack-facewash',
		'pack-hairoil',
		'van',
		'kirana',
		'godown',
		'phone-scan',
		'documents',
		'sprout-box',
		'donation-crate',
		'marketplace-bag'
	];
	const MODES: { id: ThemeMode; label: string; icon?: IconName }[] = [
		{ id: 'light', label: 'Light', icon: 'sun' },
		{ id: 'dark', label: 'Dark', icon: 'moon' },
		{ id: 'system', label: 'Auto' }
	];

	let splash = $state(false);
	let days = $state(47);
	const ROLLS = [F.planNet, F.actualNet, F.planSwing, F.quarterRecovered].map(Math.round);
	let roll = $state(ROLLS[0]);
	let live = $state(true);
	let seg = $state<'day' | 'week' | 'quarter'>('day');
	let sw = $state(true);
	let qty = $state(24);
	let otp = $state('');
	let tab = $state<'label' | 'plan' | 'exec' | 'papers'>('plan');
	let chk = $state(true);
	let q = $state('');
	let loading = $state(false);

	// the contents list follows the section in view
	let main: HTMLElement | undefined = $state();
	let on = $state('world');
	$effect(() => {
		const root = main;
		if (!root) return;
		const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (on = e.target.id)), {
			root,
			rootMargin: '-20% 0px -70% 0px'
		});
		root.querySelectorAll('section.ds-sec').forEach((s) => io.observe(s));
		return () => io.disconnect();
	});
</script>

<svelte:head>
	<title>Design system v3 · Smart-Clearance</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<AppRoot>
	<div class="ds">
		<nav class="ds-toc" aria-label="Sections">
			<div class="row tight" style="padding: 4px 8px 12px"><Mark size={30} /><Wordmark size={17} /></div>
			{#each TOC as [t, id] (t)}{#if id}<a href="#{id}" class={cx(on === id && 'on')}>{t}</a>{:else}<div class="grp">
						{t}
					</div>{/if}{/each}
		</nav>
		<main class="ds-main" bind:this={main}>
			<div class="ds-top">
				<span class="ds-brand"><Mark size={28} /></span><b class="t-headline">Design system v3</b><span class="grow"
				></span><Segmented options={MODES} value={theme.mode} onchange={theme.setMode} label="Appearance" />
			</div>
			<div class="ds-inner">
				<div class="ds-hero">
					<div>
						<h1>Every batch, tracked like an order.</h1>
						<p>
							Smart-Clearance shows near-expiry stock the way India tracks a delivery: status in big numbers, a
							stop-by-stop tracker that fills as each agent hands off, and one tap for the human yes. Apple HIG
							behaviour, shadcn anatomy, the Smart-Clearance green.
						</p>
						<div class="ds-row" style="margin-top: 22px">
							<Button variant="primary" size="lg" icon="play" onclick={() => (splash = true)}>Play the splash</Button><a
								class="btn btn-outline btn-lg"
								href="#components-start">Components<Icon name="arrow-down" size={18} /></a
							>
						</div>
					</div>
					<Later names={['TrackerCard']} what="the tracker card" />
				</div>

				<Sec
					id="world"
					title="The world"
					intro="Live order tracking, the screen every Indian phone user knows, built in Apple's component behaviour with shadcn's anatomy. Colour appears only where something is live, so a calm screen means nothing needs you."
				>
					<div class="rule-list">
						{#each WORLD as [ic, t, d] (t)}<div>
								<span class="icontile soft" style="width: 40px; height: 40px; border-radius: 12px"
									><Icon name={ic} size={20} /></span
								>
								<div>
									<b>{t}</b>
									<p>{d}</p>
								</div>
							</div>{/each}
					</div>
				</Sec>

				<Sec
					id="mark"
					title="Mark and splash"
					intro="The S is drawn as a route on a map: it leaves the godown dot and ends at an amber pin, the human tap that releases it. The squircle keeps the v1 green; the amber dot is the thread from v1's mark."
				>
					<div class="ds-two">
						<Spec label="The mark draws itself: squircle, route, godown dot, amber pin"><MarkPlayer /></Spec>
						<Spec label="Splash: shown once a session, tap to skip; reduced motion arrives already drawn">
							<div class="stage-frame" style="height: 320px">
								{#if splash}<AppRoot embedded><Splash ondone={() => (splash = false)} /></AppRoot>{:else}<div
										class="center"
										style="height: 100%; gap: 12px"
									>
										<Mark size={72} /><Button variant="primary" icon="play" onclick={() => (splash = true)}
											>Play the splash</Button
										>
									</div>{/if}
							</div>
						</Spec>
					</div>
				</Sec>

				<Sec
					id="workspace"
					title="Client workspace"
					intro="Smart-Clearance is sold to manufacturers, one workspace each, set up for that manufacturer's supply chain. The product's mark and theming lead every screen and the client's workspace sits under the mark; the client's own colours stay inside its mark. On its sign-in page the client leads and Smart-Clearance signs off."
				>
					<div class="ds-two">
						<Spec
							label="The workspace mark: the client's colours stay inside the tile; Powered by is the product's sign-off"
						>
							<div class="ds-row" style="align-items: flex-end; gap: 18px">
								{#each [72, 56, 40, 30, 22] as n (n)}<WorkspaceMark ws={WS} size={n} />{/each}
							</div>
							<div class="ds-row" style="gap: 24px"><PoweredBy /><PoweredBy size="sm" /></div>
						</Spec>
						<Spec label="Desktop sidebar: the product's mark first, the workspace under it">
							<div class="ds-sbdemo">
								<div class="sb-brand"><Mark size={32} /><Wordmark size={18} /></div>
								<div class="sb-ws">
									<WorkspaceMark ws={WS} size={30} /><span class="who"
										><span class="ws-name"><b>{WS.name}</b><Icon name="chevron-down" size={15} class="subtle" /></span
										><span class="ws-dom">{WS.domain}</span></span
									>
								</div>
								<div class="sb-item" aria-current="page">
									<Icon name="layout-dashboard" size={19} /><span>Command Center</span>
								</div>
								<div class="sb-item"><Icon name="route" size={19} /><span>Route Room</span></div>
							</div>
						</Spec>
					</div>
					<Spec
						label="The browser shows the client's own address; on a phone the workspace sits at the left of the bar"
					>
						<WindowFrame url="https://{WS.domain}/command" style="height: 112px"
							><div class="row" style="height: 72px; padding: 0 18px; gap: 10px">
								<span class="ws-lead" aria-hidden="true"><WorkspaceMark ws={WS} size={30} /></span><b class="t-headline"
									>Command Center</b
								>
							</div></WindowFrame
						>
					</Spec>
				</Sec>

				<Sec
					id="colour"
					title="Colour"
					intro="A sage-tinted neutral ground with white cards in light; a deep green-black with a faint aurora in dark. Every text pair is at least 4.5:1 in both modes. Fields keep their hue's own text colour, never grey."
				>
					<div class="ds-two"><Edition theme="light" list={LIGHT} /><Edition theme="dark" list={DARK} /></div>
					<Later names={['MixBar']} what="the channel colours in a chart" />
				</Sec>

				<Sec
					id="type"
					title="Type and numerals"
					intro="Bricolage Grotesque carries the numbers and titles, heavy and tight like Monzo's; Geist sets every operational word; Geist Mono sets ids, times and JSON; Noto Sans Devanagari keeps Hindi in step."
				>
					<div class="ds-two">
						<Spec label="Urgency lives in the numeral's own axes: drag the days">
							<div class="row base wrap" style="gap: 16px">
								<DaysNum
									{days}
									life={180}
									size="xl"
									style="color: {days < 60 ? 'var(--red-text)' : days < 108 ? 'var(--amber-text)' : 'var(--fg)'}"
								/><span class="stack tight"
									><b>days left</b><span class="ds-code"
										>wdth {Math.round(76 + 24 * (1 - days / 180))} · wght {Math.round(
											620 + 180 * (1 - days / 180)
										)}</span
									></span
								>
							</div>
							<input
								type="range"
								min="0"
								max="180"
								bind:value={days}
								aria-label="Days left"
								style="accent-color: var(--primary); width: 100%"
							/>
							<div class="row between t-caption subtle">
								<span>0 days · widest, heaviest</span><span>180 days · narrow, calm</span>
							</div>
						</Spec>
						<Spec label="Numbers roll in place when an agent changes them">
							<Money value={roll} size="l" roll from={0} />
							<div class="ds-row">
								{#each ROLLS as x (x)}<Chip pressed={roll === x} onclick={() => (roll = x)}>{fmt.inr(x)}</Chip>{/each}
							</div>
						</Spec>
					</div>
					<Spec label="Money: the rupee sign and paise set small">
						<div class="ds-row" style="gap: 28px; align-items: flex-end">
							<Money value={21770} size="xl" style="color: var(--primary-text)" /><Money
								value={-F.writeOffTotal}
								size="m"
								decimals
								style="color: var(--red-text)"
							/><Money value={14.2} size="m" decimals />
						</div>
					</Spec>
					<Spec label="Roles">
						{#each ROLES as [k, c, t] (k)}<div class="typerow">
								<span class="ds-code">{k}</span><span class={c}>{t}</span>
							</div>{/each}
					</Spec>
				</Sec>

				<Sec
					id="shape"
					title="Shape, depth, materials"
					intro="Continuous-corner radii, one-device-pixel hairlines instead of keylines, layered shadows that always carry an offset and a blur, and frosted bars over the aurora."
				>
					<div class="ds-two">
						<Spec label="Radius · 6 10 14 20 28 · pill"
							><div class="radii">
								{#each [6, 10, 14, 20, 28, 999] as r (r)}<div style="border-radius: {r}px">
										{r === 999 ? 'pill' : r}
									</div>{/each}
							</div></Spec
						>
						<Spec label="Depth"
							><div class="depths">
								{#each ['shadow-1', 'shadow-2', 'shadow-3', 'shadow-float'] as s (s)}<div
										style="box-shadow: var(--{s}), 0 0 0 var(--hair) var(--line)"
									>
										{s}
									</div>{/each}
							</div></Spec
						>
					</div>
					<Spec label="Material: a frosted tab bar over the aurora">
						<div class="glassdemo">
							<div class="bar">
								{#each [['layout-dashboard', 'Today'], ['boxes', 'Batches'], ['route', 'Routes'], ['bell', 'Inbox']] as [i, l] (l)}<span
										class="stack tight"
										style="justify-items: center; gap: 3px"><Icon name={i as IconName} size={22} />{l}</span
									>{/each}
							</div>
						</div>
					</Spec>
				</Sec>

				<Sec
					id="motion"
					title="Motion"
					intro="Exponential ease-out for state (160 to 320 ms), springs for sheets and presses, 700 ms rolls for numbers, one aura turn when an agent starts work. Nothing loops: motion stops within five seconds. Reduced motion arrives already in place."
				>
					<div class="ds-two">
						<Later names={['Tracker', 'TrackerCompact']} what="the tracker filling as each agent hands off" />
						<Spec label="Agents carry an aura while they work; it stops when the work stops">
							<div class="ds-row" style="gap: 18px">
								<Aura on={live} class="icontile soft" style="width: 56px; height: 56px; border-radius: 18px"
									><Icon name="scan-line" size={26} /></Aura
								>
								<div class="stack tight">
									<b>Vision Agent</b><span class="t-footnote muted"
										>{live ? 'Reading the label photo…' : 'Read: confidence 0.97, matches'}</span
									>
								</div>
							</div>
							<div class="row">
								<Switch bind:checked={live} label="Agent working" /><span class="t-footnote muted">Agent working</span>
							</div>
						</Spec>
					</div>
				</Sec>

				<Sec
					id="icons"
					title="Icons"
					intro="Lucide, the set shadcn ships with, at a 1.75 stroke on a 24 grid; filled weight only for the selected tab."
				>
					<div class="icongrid">
						{#each (Object.keys(ICONS) as IconName[]).filter((n) => n !== 'google').slice(0, 72) as n (n)}<div>
								<Icon name={n} size={22} /><span>{n}</span>
							</div>{/each}
					</div>
				</Sec>

				<Sec
					id="imagery"
					title="Imagery"
					intro="Soft 3D renders of the products, places and documents, made with Qwen-Image on a transparent ground; every file carries its prompt and seed. People are the existing portraits."
				>
					<div class="imggrid">
						{#each RENDERS as n (n)}<figure>
								<div><Product name={n} size={130} /></div>
								<figcaption>{n}</figcaption>
							</figure>{/each}
					</div>
					<Later names={['LabelShot']} what="the label shot and the carton loop" />
					<div class="ds-row">
						{#each ds.people as p (p.id)}<span class="row tight"
								><Avatar person={p} size="lg" /><span class="stack tight" style="gap: 0"
									><b class="t-subhead">{p.short}</b><span class="t-caption subtle">{p.org}</span></span
								></span
							>{/each}
					</div>
				</Sec>

				<div id="components-start"></div>
				<Sec
					id="buttons"
					title="Buttons and badges"
					intro="One primary per screen; amber is reserved for the human yes; violet appears only on ExpireSoon's own surfaces."
				>
					<Spec label="Variants">
						<div class="ds-row">
							<Button variant="primary" icon="route">Route this batch</Button><Button variant="approve" icon="check"
								>Approve plan</Button
							><Button variant="tinted" icon="camera">Ask for a photo</Button><Button>Secondary</Button><Button
								variant="outline">Outline</Button
							><Button variant="ghost">Ghost</Button><Button variant="destructive" icon="trash-2">Write off</Button
							><Button variant="violet" icon="tag">Place bid</Button><Button variant="link">Link</Button>
						</div>
						<div class="ds-row">
							<Button size="sm">Small</Button><Button size="lg" variant="primary">Large</Button><Button
								size="xl"
								variant="approve"
								icon="check">Approve · ₹21,770</Button
							><Button
								variant="primary"
								{loading}
								onclick={() => {
									loading = true;
									setTimeout(() => (loading = false), 1500);
								}}>Loading state</Button
							><Button disabled>Disabled</Button><IconButton icon="bell" label="Notifications" badge={3} /><IconButton
								icon="x"
								label="Close"
								round
							/>
						</div>
					</Spec>
					<Spec label="Badges, chips, gates, keys">
						<div class="ds-row">
							<Badge tone="red" dot live>At risk</Badge><Badge tone="amber" dot>Awaiting approval</Badge><Badge
								tone="green"
								icon="check">Verified</Badge
							><Badge tone="violet">ExpireSoon</Badge><Badge tone="blue" icon="bell">Pushed</Badge><Badge>Neutral</Badge
							><Badge outline>Outline</Badge><Badge solid tone="green">Live</Badge><span class="badge-count">14</span>
						</div>
						<div class="ds-row">
							<Chip pressed count={9}>All</Chip><Chip count={2}>At risk</Chip><Chip count={5}>Gated</Chip><Chip
								count={3}>Safe</Chip
							><GateChips gates={ds.gates} /><Kbd>⌘</Kbd><Kbd>K</Kbd>
						</div>
					</Spec>
				</Sec>

				<Sec
					id="cards"
					title="Cards and lists"
					intro="Cards sit on the ground with a hairline and a soft shadow; inset grouped lists carry settings and summaries the way iOS does."
				>
					<div class="ds-two">
						<Card class="stack snug">
							<div class="card-head">
								<span class="card-title">Recommended split</span><Badge tone="green">Router · 09:22</Badge>
							</div>
							<p class="t-footnote muted">
								The kirana cluster fills first at ₹17.50 net a unit, capped at 588 by what 38 kiranas can move in 14
								days; the remaining 772 go to ExpireSoon. (The split bar arrives with the workspace app port.)
							</p>
						</Card>
						<List head="Guardrails" foot="Changes are logged with who and when." icons
							><ListRow
								icon="percent"
								title="Floor price, snacks"
								value="35% of MRP"
								chevron
								onclick={() => {}}
							/><ListRow
								icon="heart-handshake"
								iconTone="red"
								title="Donation partners"
								value="2"
								chevron
								onclick={() => {}}
							/><ListRow
								icon="shield-check"
								iconTone="blue"
								title="Approval policy"
								sub="First 10 routes per channel need a tap"
								chevron
								onclick={() => {}}
							/><ListRow icon="bell" iconTone="amber" title="Push notifications"><span></span></ListRow></List
						>
					</div>
					<Later names={['SplitBar', 'MoneyPanel']} what="the split bar and the money panel" />
				</Sec>

				<Sec
					id="nav"
					title="Navigation"
					intro="A large title collapses into the frosted bar as you scroll; four tabs on phones; a rail on tablets; a sidebar on desktops."
				>
					<Later names={['Shell', 'Page', 'PhoneFrame', 'BatchRow']} what="the app shell" />
				</Sec>

				<Sec
					id="controls"
					title="Controls"
					intro="Native iOS behaviour for toggles, segmented controls and steppers; shadcn anatomy for fields, tabs and selects. Labels are always visible; errors name the problem and the recovery."
				>
					<div class="ds-two">
						<Spec>
							<Field label="Phone number" help="We send a 6-digit code by SMS." htmlFor="ph"
								><Input id="ph" icon="phone" inputmode="tel" value="+91 98230 44118" /></Field
							>
							<Field label="One-time code"><OTP bind:value={otp} /></Field>
							<Field
								label="Floor price, snacks"
								error="The floor cannot go below 30% of MRP. Raise it or ask Priya to change the rule."
								htmlFor="fl"><Input id="fl" value="25%" /></Field
							>
							<Field label="Search batches"
								><SearchField bind:value={q} placeholder="Batch, product, distributor" /></Field
							>
						</Spec>
						<Spec>
							<div class="row between">
								<span>Daily 09:00 Watcher run</span><Switch bind:checked={sw} label="Daily Watcher run" />
							</div>
							<div class="row between">
								<span>Units to order</span><Stepper bind:value={qty} step={12} min={12} max={120} label="units" />
							</div>
							<Field label="Channel" htmlFor="chs"
								><Select id="chs" value="kirana"
									><option value="kirana">Kirana cluster push</option><option value="expiresoon"
										>ExpireSoon listing</option
									><option value="foodbank">Food bank donation</option></Select
								></Field
							>
							<Field label="Note to the distributor" htmlFor="nt"
								><Textarea id="nt" placeholder="Hindi or English" /></Field
							>
							<Check bind:checked={chk}>Also email the document pack to finance</Check>
							<Segmented
								options={[
									{ id: 'day', label: 'Day' },
									{ id: 'week', label: 'Week' },
									{ id: 'quarter', label: 'Quarter' }
								]}
								bind:value={seg}
								label="Range"
							/>
							<Tabs
								tabs={[
									{ id: 'label', label: 'Label' },
									{ id: 'plan', label: 'Plan', badge: 1 },
									{ id: 'exec', label: 'Execution' },
									{ id: 'papers', label: 'Papers' }
								]}
								bind:value={tab}
							/>
						</Spec>
					</div>
				</Sec>

				<Sec
					id="data"
					title="Data and tables"
					intro="Tabular figures, right-aligned money, sortable headers, a hairline between rows; the Valuer's chart always has this table view beside it."
				>
					<Later names={['ChannelTable', 'DataTable', 'Tile']} what="tables and tiles" />
				</Sec>

				<Sec
					id="overlays"
					title="Sheets, alerts, pushes"
					intro="Every human moment arrives as a push; tapping it opens the sheet where the decision lives."
				>
					<OverlaysDemo />
				</Sec>

				<Sec
					id="tracker"
					title="The tracker"
					intro="Horizontal on wide screens, vertical in a sheet on phones, the way delivery apps show an order's stops. The human stop pulses amber when it waits for you."
				>
					<Later names={['Tracker', 'VTracker', 'TrackerCompact']} what="the tracker" />
				</Sec>

				<Sec
					id="agents"
					title="Agents at work"
					intro="Each hand-off is a row: who, what, the tool calls, the result. Gaps between rows are drawn to the clock, so a long wait looks long."
				>
					<Later names={['AgentFeed', 'CodeBlock']} what="the agent feed and the JSON card" />
				</Sec>

				<Sec
					id="charts"
					title="Map and charts"
					intro="A schematic map, never a political one; charts with one axis, fixed series order, direct labels and hover tooltips."
				>
					<Later
						names={['ClusterMap', 'HaulLine', 'ChannelBars', 'TrendChart', 'MixBar']}
						what="the map and the charts"
					/>
				</Sec>

				<Sec
					id="feedback"
					title="Feedback"
					intro="Skeletons in the ground's own tints, the iOS spinner, progress that scales instead of resizing, empty states that teach the next step."
				>
					<Later names={['Skeleton', 'Progress', 'Empty', 'DocCard']} what="loading, empty and document states" />
				</Sec>

				<Sec
					id="patterns"
					title="Screen patterns"
					intro="Pieces the role screens are built from: the push that starts every human moment, the label read from the shelf, documents that stay on paper in both themes, ExpireSoon in its own look, and the kirana offer in Hindi."
				>
					<Later names={['StatusBar', 'PhoneFrame']} what="the role screens' patterns" />
				</Sec>
				<p class="t-footnote subtle" style="margin-top: 48px">
					Synthetic demo data. Munchly Foods, Glowra, ExpireSoon and every person shown are fictional. Smart-Clearance
					design system v3.
				</p>
			</div>
		</main>
	</div>
</AppRoot>
