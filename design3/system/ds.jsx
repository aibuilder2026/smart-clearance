// Smart-Clearance design system v3 · the foundations and components page
(function () {
  const { useState, useEffect, useRef, Fragment } = React;
  const { motion } = Motion;
  const K = window.SC3; const D = window.SC3_DATA; const M = window.SC3_MONEY; const fmt = M.fmt;
  const { cx, ThemeProvider, useTheme, AppRoot, useApp, Icon, Button, IconButton, Badge, Chip, Kbd, Card, List, ListRow, Segmented, Switch, Field, Input, SearchField, Select, Textarea, Stepper, OTP, Tabs, Check,
    DataTable, Skeleton, Progress, Empty, Avatar, Product, Sheet, Alert, Menu, NoticeHost, useNotice, Mark, Wordmark, Splash, Page, Roll, Money, DaysNum, GateChips, Countdown, Tile, Aura, Tracker, VTracker, AgentFeed,
    ClusterMap, HaulLine, ChannelBars, TrendChart, MixBar, CodeBlock, PhoneFrame, WindowFrame, TrackerCard, TrackerCompact, BatchRow, ChannelTable, SplitBar, MoneyPanel, DocCard, Spinner, WorkspaceMark, PoweredBy } = K;

  const TOC = [["Foundations", null], ["The world", "world"], ["Mark and splash", "mark"], ["Client workspace", "workspace"], ["Colour", "colour"], ["Type and numerals", "type"], ["Shape, depth, materials", "shape"], ["Motion", "motion"], ["Icons", "icons"], ["Imagery", "imagery"],
    ["Components", null], ["Buttons and badges", "buttons"], ["Cards and lists", "cards"], ["Navigation", "nav"], ["Controls", "controls"], ["Data and tables", "data"], ["Sheets, alerts, pushes", "overlays"], ["The tracker", "tracker"], ["Agents at work", "agents"], ["Map and charts", "charts"], ["Feedback", "feedback"], ["Screen patterns", "patterns"]];

  function Sec({ id, title, intro, children }) { return <section className="ds-sec" id={id}><header><h2>{title}</h2>{intro && <p>{intro}</p>}</header>{children}</section>; }
  function Spec({ label, children, style }) { return <div className="ds-specimen" style={style}>{label && <span className="lbl">{label}</span>}{children}</div>; }

  const hero = D.batchView(D.BATCHES[0]);
  const LIGHT = [["--bg", "#f2f6f3", "Ground"], ["--surface", "#ffffff", "Card"], ["--fg", "#0d1c15", "Ink"], ["--fg-2", "#45554d", "Ink 2"], ["--fg-3", "#5f6e67", "Ink 3"], ["--primary", "#167a52", "Green, the agent and primary"], ["--amber", "#f2b437", "Amber, the human yes"], ["--red", "#e5484d", "Red, risk only"], ["--violet", "#6e56cf", "Violet, ExpireSoon only"], ["--blue", "#0a7ae0", "Blue, pushes and info"]];
  const DARK = [["--bg", "#070b09", "Ground"], ["--surface", "#101613", "Card"], ["--fg", "#ecf2ee", "Ink"], ["--fg-2", "#a7b4ad", "Ink 2"], ["--fg-3", "#82908a", "Ink 3"], ["--primary", "#3ccb8a", "Green"], ["--amber", "#f7c04a", "Amber"], ["--red", "#ec5d5e", "Red"], ["--violet", "#8b74f0", "Violet"], ["--blue", "#3b9eff", "Blue"]];
  const RAMP = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
  const CH_NAMES = { kirana: "Kirana cluster", expiresoon: "ExpireSoon", staff: "Staff sale", d2c: "Brand site", foodbank: "Food bank", writeoff: "Write-off" };

  function Swatches({ list }) { return <div className="swatches">{list.map(([v, hex, name]) => <div key={v} className="sw"><div className="chipc" style={{ background: `var(${v})`, color: v === "--amber" ? "#241700" : ["--bg", "--surface"].includes(v) ? "var(--fg)" : v.startsWith("--fg") ? "var(--bg)" : "#fff" }}>{hex}</div><div className="meta"><b>{name}</b><span>{v}</span></div></div>)}</div>; }
  function Edition({ theme, list }) {
    return <div className="edition" data-theme={theme}><div className="ground" aria-hidden="true" /><div className="layer stack snug">
      <div className="row between"><b className="row tight"><Icon name={theme === "dark" ? "moon" : "sun"} size={18} />{theme === "dark" ? "Dark" : "Light"}</b><Badge tone="green" dot>composed separately</Badge></div>
      <Swatches list={list} />
      <div className="ramp">{RAMP.map(r => <div key={r} style={{ background: `var(--green-${r}, #000)`, color: +r >= 500 ? "#fff" : "#0d1c15" }}>{r}</div>)}</div>
      <div className="row wrap" style={{ gap: 8 }}><Button variant="primary" size="sm" icon="route">Route</Button><Button variant="approve" size="sm" icon="check">Approve</Button><Button variant="tinted" size="sm">Tinted</Button><Badge tone="red" dot>At risk</Badge><Badge tone="violet">ExpireSoon</Badge></div>
    </div></div>;
  }

  function UrgencySpecimen() {
    const [days, setDays] = useState(47);
    return <Spec label="Urgency lives in the numeral's own axes: drag the days">
      <div className="row base wrap" style={{ gap: 16 }}><DaysNum days={days} life={180} size="xl" style={{ color: days < 60 ? "var(--red-text)" : days < 108 ? "var(--amber-text)" : "var(--fg)" }} /><span className="stack tight"><b>days left</b><span className="ds-code">wdth {Math.round(76 + 24 * (1 - days / 180))} · wght {Math.round(620 + 180 * (1 - days / 180))}</span></span></div>
      <input type="range" min="0" max="180" value={days} onChange={e => setDays(+e.target.value)} aria-label="Days left" style={{ accentColor: "var(--primary)", width: "100%" }} />
      <div className="row between t-caption subtle"><span>0 days · widest, heaviest</span><span>180 days · narrow, calm</span></div>
    </Spec>;
  }
  function RollSpecimen() {
    const vals = [D.PLAN.net, D.ACTUAL.net, D.PLAN.swing, D.QUARTER.recovered].map(Math.round); const [v, setV] = useState(vals[0]);
    return <Spec label="Numbers roll in place when an agent changes them">
      <Money value={v} size="l" roll from={0} key={0} />
      <div className="ds-row">{vals.map(x => <Chip key={x} pressed={v === x} onClick={() => setV(x)}>{fmt.inr(x)}</Chip>)}</div>
    </Spec>;
  }
  function MotionSpecimen() {
    const [step, setStep] = useState(2); const [live, setLive] = useState(true); const app = useApp();
    const stages = D.STAGES.map(s => ({ id: s.id, title: s.title, human: s.human }));
    return <div className="ds-two">
      <Spec label="The tracker fills as each agent hands off">
        {app.bp === "phone" ? <TrackerCompact done={step} current={step < 9 ? step : -1} /> : <Tracker stages={stages} done={step} current={step < 9 ? step : -1} times={K.STAGE_TIMES} />}
        <div className="ds-row"><Button size="sm" icon="chevron-left" onClick={() => setStep(s => Math.max(0, s - 1))}>Back</Button><Button size="sm" variant="primary" iconRight="chevron-right" onClick={() => setStep(s => Math.min(9, s + 1))}>Next stop</Button><span className="t-footnote subtle">{step} of 9 done</span></div>
      </Spec>
      <Spec label="Agents carry an aura while they work; it stops when the work stops">
        <div className="ds-row" style={{ gap: 18 }}><Aura on={live} className="icontile soft" style={{ width: 56, height: 56, borderRadius: 18 }}><Icon name="scan-line" size={26} /></Aura><div className="stack tight"><b>Vision Agent</b><span className="t-footnote muted">{live ? "Reading the label photo…" : "Read: confidence 0.97, matches"}</span></div></div>
        <div className="row"><Switch checked={live} onChange={setLive} label="Agent working" /><span className="t-footnote muted">Agent working</span></div>
      </Spec>
    </div>;
  }

  function OverlaysDemo() {
    const [sheet, setSheet] = useState(null); const [alert, setAlert] = useState(false); const [menu, setMenu] = useState(false);
    const { push, toast } = useNotice();
    return <Spec label="Sheets rise from the bottom on phones with medium and large detents, and float in from the side on larger screens">
      <div className="ds-row">
        <Button variant="approve" icon="check" onClick={() => setSheet("auto")}>Open the approve sheet</Button>
        <Button onClick={() => setSheet("center")}>Centred sheet</Button>
        <Button onClick={() => setAlert(true)}>Alert</Button>
        <span style={{ position: "relative" }}><Button icon="ellipsis" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}>Menu</Button><Menu open={menu} onClose={() => setMenu(false)} align="left" items={[{ label: "MF-2409-117", heading: true }, { label: "Open the batch", icon: "external-link" }, { label: "Ask for a label photo", icon: "camera" }, "-", { label: "Write off", icon: "trash-2", danger: true }]} /></span>
        <Button variant="primary" icon="bell" onClick={() => push({ ...D.PUSH.plan, onOpen: () => setSheet("auto") })}>Push a notification</Button>
        <Button onClick={() => push({ ...D.PUSH.offer, person: D.PEOPLE.rakesh, app: "Rakesh Traders" })}>Hindi push</Button>
        <Button onClick={() => toast({ text: "Approved · listing going up", tone: "ok" })}>Toast</Button>
      </div>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} side={sheet === "center" ? "center" : undefined} detent="medium" title="Approve the plan" footer={<Button variant="approve" size="lg" block icon="check" onClick={() => { setSheet(null); toast({ text: "Plan placed · 09:40", tone: "ok" }); }}>Approve · release the agents</Button>}>
        <div className="stack">
          <div className="row base wrap" style={{ gap: 16 }}><Money value={D.PLAN.net} size="l" style={{ color: "var(--primary-text)" }} /><span className="muted">net recovered</span></div>
          <List><ListRow icon="trending-up" title="Swing against the write-off" value={fmt.inr(D.PLAN.swing)} /><ListRow icon="badge-check" iconTone="blue" title="GST input credit retained" value={fmt.inr(D.PLAN.itcRetained)} /></List>
          <p className="t-footnote muted">Nothing is listed, messaged or shipped before this tap. Drag the grabber to change the sheet's height on a phone.</p>
        </div>
      </Sheet>
      <Alert open={alert} onClose={() => setAlert(false)} title="Write off MF-2409-117?" message={`${fmt.num(D.PLAN.units)} units go to disposal and the ${fmt.inr(D.PLAN.writeOff.itc)} GST input credit is reversed. This costs Munchly ${fmt.inr(D.PLAN.writeOff.total)}.`} actions={[{ label: "Cancel", strong: true }, { label: "Write off", danger: true }]} />
    </Spec>;
  }

  function Page_() {
    const { mode, setMode } = useTheme(); const app = useApp(); const [splash, setSplash] = useState(false); const [on, setOn] = useState("world");
    const mainRef = useRef(null);
    useEffect(() => { const root = mainRef.current; if (!root) return; const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) setOn(e.target.id); }); }, { root, rootMargin: "-20% 0px -70% 0px" }); root.querySelectorAll("section.ds-sec").forEach(s => io.observe(s)); return () => io.disconnect(); }, []);
    const [seg, setSeg] = useState("day"); const [sw, setSw] = useState(true); const [qty, setQty] = useState(24); const [otp, setOtp] = useState(""); const [tab, setTab] = useState("plan"); const [chk, setChk] = useState(true); const [q, setQ] = useState(""); const [loading, setLoading] = useState(false);
    const views = D.BATCHES.map(D.batchView); views[1].phase = "executing";
    return <div className="ds">
      <nav className="ds-toc" aria-label="Sections"><div className="row tight" style={{ padding: "4px 8px 12px" }}><Mark size={30} /><Wordmark size={17} /></div>{TOC.map(([t, id]) => id ? <a key={id} href={"#" + id} className={cx(on === id && "on")}>{t}</a> : <div key={t} className="grp">{t}</div>)}</nav>
      <main className="ds-main" ref={mainRef}>
        <div className="ds-top"><span className="ds-brand"><Mark size={28} /></span><b className="t-headline">Design system v3</b><span className="grow" /><Segmented options={[{ id: "light", label: "Light", icon: "sun" }, { id: "dark", label: "Dark", icon: "moon" }, { id: "system", label: "Auto" }]} value={mode} onChange={setMode} label="Appearance" /></div>
        <div className="ds-inner">
          <div className="ds-hero">
            <div>
              <h1>Every batch, tracked like an order.</h1>
              <p>Smart-Clearance shows near-expiry stock the way India tracks a delivery: status in big numbers, a stop-by-stop tracker that fills as each agent hands off, and one tap for the human yes. Apple HIG behaviour, shadcn anatomy, the Smart-Clearance green.</p>
              <div className="ds-row" style={{ marginTop: 22 }}><Button variant="primary" size="lg" icon="play" onClick={() => setSplash(true)}>Play the splash</Button><a className="btn btn-outline btn-lg" href="#components-start">Components<Icon name="arrow-down" size={18} /></a></div>
            </div>
            <TrackerCard view={hero} done={2} current={2} eta="Plan ready in about 20 min" agentLive="Vision is waiting for the label photo" primary={<Button variant="primary" iconRight="arrow-right">Open Route Room</Button>} />
          </div>

          <Sec id="world" title="The world" intro="Live order tracking, the screen every Indian phone user knows, built in Apple's component behaviour with shadcn's anatomy. Colour appears only where something is live, so a calm screen means nothing needs you.">
            <div className="rule-list">
              {[["route", "A batch is an order", "Status in a giant numeral, an ETA chip, a nine-stop tracker from Connect to Report, a map with the godown and the van."], ["circle-dot", "Colour only where something is live", "Resting rows stay neutral. Red marks risk, amber marks the one human yes, violet belongs to ExpireSoon alone."], ["indian-rupee", "Numbers carry the money", "Heavy Bricolage numerals with the rupee sign and paise set small, in the Monzo manner; they roll in place when an agent changes them."], ["sparkles", "Agents glow while they work", "A mint-to-sky aura turns around the agent that is working and stops the moment it hands off."], ["smartphone", "PWA first", "A tab bar on phones, a rail on tablets, a sidebar on desktops; sheets with detents; safe areas honoured; light and dark composed separately."]].map(([ic, t, d]) => <div key={t}><span className="icontile soft" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={ic} size={20} /></span><div><b>{t}</b><p>{d}</p></div></div>)}
            </div>
          </Sec>

          <Sec id="mark" title="Mark and splash" intro="The S is drawn as a route on a map: it leaves the godown dot and ends at an amber pin, the human tap that releases it. The squircle keeps the v1 green; the amber dot is the thread from v1's mark.">
            <div className="ds-two">
              <Spec label="The mark draws itself: squircle, route, godown dot, amber pin">
                <MarkPlayer />
              </Spec>
              <Spec label="Splash: shown once a session, tap to skip; reduced motion arrives already drawn">
                <div className="stage-frame" style={{ height: 320 }}>{splash ? <AppRoot><Splash onDone={() => setSplash(false)} /></AppRoot> : <div className="center" style={{ height: "100%", gap: 12 }}><Mark size={72} /><Button variant="primary" icon="play" onClick={() => setSplash(true)}>Play the splash</Button></div>}</div>
              </Spec>
            </div>
          </Sec>

          <Sec id="workspace" title="Client workspace" intro="Smart-Clearance is sold to manufacturers, one workspace each, set up for that manufacturer's supply chain. The product's mark and theming lead every screen and the client's workspace sits under the mark; the client's own colours stay inside its mark. On its sign-in page the client leads and Smart-Clearance signs off.">
            <div className="ds-two">
              <Spec label="The workspace mark: the client's colours stay inside the tile; Powered by is the product's sign-off">
                <div className="ds-row" style={{ alignItems: "flex-end", gap: 18 }}>{[72, 56, 40, 30, 22].map(n => <WorkspaceMark key={n} ws={D.WORKSPACE} size={n} />)}</div>
                <div className="ds-row" style={{ gap: 24 }}><PoweredBy /><PoweredBy size="sm" /></div>
              </Spec>
              <Spec label="Desktop sidebar: the product's mark first, the workspace under it">
                <div className="ds-sbdemo"><div className="sb-brand"><Mark size={32} /><Wordmark size={18} /></div><div className="sb-ws"><WorkspaceMark ws={D.WORKSPACE} size={30} /><span className="who"><span className="ws-name"><b>{D.WORKSPACE.name}</b><Icon name="chevron-down" size={15} className="subtle" /></span><span className="ws-dom">{D.WORKSPACE.domain}</span></span></div><div className="sb-item" aria-current="page"><Icon name="layout-dashboard" size={19} /><span>Command Center</span></div><div className="sb-item"><Icon name="route" size={19} /><span>Route Room</span></div></div>
              </Spec>
            </div>
            <Spec label="The browser shows the client's own address; on a phone the workspace sits at the left of the bar">
              <WindowFrame url={"https://" + D.WORKSPACE.domain + "/command"} style={{ height: 112 }}><div className="row" style={{ height: 72, padding: "0 18px", gap: 10 }}><span className="ws-lead" aria-hidden="true"><WorkspaceMark ws={D.WORKSPACE} size={30} /></span><b className="t-headline">Command Center</b></div></WindowFrame>
            </Spec>
          </Sec>

          <Sec id="colour" title="Colour" intro="A sage-tinted neutral ground with white cards in light; a deep green-black with a faint aurora in dark. Every text pair is at least 4.5:1 in both modes. Fields keep their hue's own text colour, never grey.">
            <div className="ds-two"><Edition theme="light" list={LIGHT} /><Edition theme="dark" list={DARK} /></div>
            <Spec label="Channel colours, in fixed series order; validated for colour-blind and normal-vision separation in both modes">
              <MixBar mix={[["kirana", 1], ["expiresoon", 1], ["staff", 1], ["d2c", 1], ["foodbank", 1], ["writeoff", 1]]} names={CH_NAMES} />
            </Spec>
          </Sec>

          <Sec id="type" title="Type and numerals" intro="Bricolage Grotesque carries the numbers and titles, heavy and tight like Monzo's; Geist sets every operational word; Geist Mono sets ids, times and JSON; Noto Sans Devanagari keeps Hindi in step.">
            <div className="ds-two"><UrgencySpecimen /><RollSpecimen /></div>
            <Spec label="Money: the rupee sign and paise set small">
              <div className="ds-row" style={{ gap: 28, alignItems: "flex-end" }}><Money value={21770} size="xl" style={{ color: "var(--primary-text)" }} /><Money value={-D.PLAN.writeOff.total} size="m" decimals style={{ color: "var(--red-text)" }} /><Money value={14.2} size="m" decimals /></div>
            </Spec>
            <Spec label="Roles">
              {[["Large title · 36", "t-large", "Command Center"], ["Title 1 · 30", "t-title1", "Route Room"], ["Title 2 · 24", "t-title2", "Five channels, priced"], ["Title 3 · 20", "t-title3", "Recommended split"], ["Headline · 17", "t-headline", "Masala Chips 150 g"], ["Body · 15", "t-body", "Nothing is listed, messaged or shipped before your tap."], ["Subhead · 14", "t-subhead muted", "Rakesh Traders · Kalamna Market godown, Nagpur"], ["Footnote · 13", "t-footnote subtle", "Synthetic demo data · disposal, EPR and CO₂e are indicative"], ["Mono · ids and JSON", "mono", "MF-2409-117 · POST /v1/listings · 201"], ["Devanagari", "hi t-callout", "आज का खास ऑफर: 10 पैकेट लो, 2 मुफ़्त"]].map(([k, c, t]) => <div key={k} className="typerow"><span className="ds-code">{k}</span><span className={c}>{t}</span></div>)}
            </Spec>
          </Sec>

          <Sec id="shape" title="Shape, depth, materials" intro="Continuous-corner radii, one-device-pixel hairlines instead of keylines, layered shadows that always carry an offset and a blur, and frosted bars over the aurora.">
            <div className="ds-two">
              <Spec label="Radius · 6 10 14 20 28 · pill"><div className="radii">{[6, 10, 14, 20, 28, 999].map(r => <div key={r} style={{ borderRadius: r }}>{r === 999 ? "pill" : r}</div>)}</div></Spec>
              <Spec label="Depth"><div className="depths">{["shadow-1", "shadow-2", "shadow-3", "shadow-float"].map(s => <div key={s} style={{ boxShadow: `var(--${s}), 0 0 0 var(--hair) var(--line)` }}>{s}</div>)}</div></Spec>
            </div>
            <Spec label="Material: a frosted tab bar over the aurora"><div className="glassdemo"><div className="bar">{[["layout-dashboard", "Today"], ["boxes", "Batches"], ["route", "Routes"], ["bell", "Inbox"]].map(([i, l]) => <span key={l} className="stack tight" style={{ justifyItems: "center", gap: 3 }}><Icon name={i} size={22} />{l}</span>)}</div></div></Spec>
          </Sec>

          <Sec id="motion" title="Motion" intro="Exponential ease-out for state (160 to 320 ms), springs for sheets and presses, 700 ms rolls for numbers, one aura turn when an agent starts work. Nothing loops: motion stops within five seconds. Reduced motion arrives already in place.">
            <MotionSpecimen />
          </Sec>

          <Sec id="icons" title="Icons" intro="Lucide, the set shadcn ships with, at a 1.75 stroke on a 24 grid; filled weight only for the selected tab.">
            <div className="icongrid">{Object.keys(window.SC3_ICONS).filter(n => n !== "google").slice(0, 72).map(n => <div key={n}><Icon name={n} size={22} /><span>{n}</span></div>)}</div>
          </Sec>

          <Sec id="imagery" title="Imagery" intro="Soft 3D renders of the products, places and documents, made with Qwen-Image on a transparent ground; every file carries its prompt and seed. People are the existing portraits.">
            <div className="imggrid">{["carton-hero", "pack-chips", "pack-biscuits", "pack-chikki", "pack-poha", "pack-oats", "pack-mango", "pack-facewash", "pack-hairoil", "van", "kirana", "godown", "phone-scan", "documents", "sprout-box", "donation-crate", "marketplace-bag"].map(n => <figure key={n}><div><Product name={n} size={130} /></div><figcaption>{n}</figcaption></figure>)}</div>
            <div className="ds-two" style={{ marginBottom: 20 }}>
              <Spec label="Label shot · the label is set in type over the photo"><div style={{ borderRadius: 16, overflow: "hidden" }}>{React.createElement(window.SC3_SCREENS.LabelShot)}</div></Spec>
              <Spec label="Carton loop · LTX, light ground only; dark mode shows the still"><video poster={(window.SC3_IMG || "img/").replace(/img\/$/, "media/") + "carton-loop-poster.webp"} muted playsInline autoPlay controls style={{ width: "100%", borderRadius: 16, display: "block" }}><source src={(window.SC3_IMG || "img/").replace(/img\/$/, "media/") + "carton-loop.webm"} type="video/webm" /><source src={(window.SC3_IMG || "img/").replace(/img\/$/, "media/") + "carton-loop.mp4"} type="video/mp4" /></video></Spec>
            </div>
            <div className="ds-row">{Object.values(D.PEOPLE).map(p => <span key={p.id} className="row tight"><Avatar person={p} size="lg" /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{p.short}</b><span className="t-caption subtle">{p.org}</span></span></span>)}</div>
          </Sec>

          <div id="components-start" />
          <Sec id="buttons" title="Buttons and badges" intro="One primary per screen; amber is reserved for the human yes; violet appears only on ExpireSoon's own surfaces.">
            <Spec label="Variants">
              <div className="ds-row"><Button variant="primary" icon="route">Route this batch</Button><Button variant="approve" icon="check">Approve plan</Button><Button variant="tinted" icon="camera">Ask for a photo</Button><Button>Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive" icon="trash-2">Write off</Button><Button variant="violet" icon="tag">Place bid</Button><Button variant="link">Link</Button></div>
              <div className="ds-row"><Button size="sm">Small</Button><Button size="lg" variant="primary">Large</Button><Button size="xl" variant="approve" icon="check">Approve · ₹21,770</Button><Button variant="primary" loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>Loading state</Button><Button disabled>Disabled</Button><IconButton icon="bell" label="Notifications" badge={3} /><IconButton icon="x" label="Close" round /></div>
            </Spec>
            <Spec label="Badges, chips, gates, keys">
              <div className="ds-row"><Badge tone="red" dot live>At risk</Badge><Badge tone="amber" dot>Awaiting approval</Badge><Badge tone="green" icon="check">Verified</Badge><Badge tone="violet">ExpireSoon</Badge><Badge tone="blue" icon="bell">Pushed</Badge><Badge>Neutral</Badge><Badge outline>Outline</Badge><Badge solid tone="green">Live</Badge><span className="badge-count">14</span></div>
              <div className="ds-row"><Chip pressed count={9}>All</Chip><Chip count={2}>At risk</Chip><Chip count={5}>Gated</Chip><Chip count={3}>Safe</Chip><GateChips gates={hero.assess.gates} /><Kbd>⌘</Kbd><Kbd>K</Kbd></div>
            </Spec>
          </Sec>

          <Sec id="cards" title="Cards and lists" intro="Cards sit on the ground with a hairline and a soft shadow; inset grouped lists carry settings and summaries the way iOS does.">
            <div className="ds-two">
              <Card className="stack snug"><div className="card-head"><span className="card-title">Recommended split</span><Badge tone="green">Router · 09:22</Badge></div><SplitBar plan={D.PLAN} sku={D.SKUS.chips} /><p className="t-footnote muted">The kirana cluster fills first at ₹17.50 net a unit, capped at 588 by what 38 kiranas can move in 14 days; the remaining 772 go to ExpireSoon.</p></Card>
              <List head="Guardrails" foot="Changes are logged with who and when." icons><ListRow icon="percent" title="Floor price, snacks" value="35% of MRP" chevron onClick={() => {}} /><ListRow icon="heart-handshake" iconTone="red" title="Donation partners" value="2" chevron onClick={() => {}} /><ListRow icon="shield-check" iconTone="blue" title="Approval policy" sub="First 10 routes per channel need a tap" chevron onClick={() => {}} /><ListRow icon="bell" iconTone="amber" title="Push notifications" leading={null}><span /></ListRow></List>
            </div>
            <MoneyPanel plan={D.PLAN} />
          </Sec>

          <Sec id="nav" title="Navigation" intro="A large title collapses into the frosted bar as you scroll; four tabs on phones; a rail on tablets; a sidebar on desktops.">
            <div className="phone-holder"><PhoneFrame time="9:41" scale={0.82} style={{ marginBottom: -150 }}><K.Shell nav={[{ id: "today", label: "Command Center", short: "Today", icon: "layout-dashboard" }, { id: "batches", label: "Batches", icon: "boxes" }, { id: "inbox", label: "Inbox", icon: "bell", badge: 2 }, { id: "me", label: "Profile", icon: "user" }]} current="today" onNav={() => {}}><Page title="Command Center" sub="Fri 2 Oct · Watcher ran at 09:00" actions={<IconButton icon="search" label="Search" />}><div className="stack">{views.slice(0, 5).map(v => <Card key={v.id} pad={false} style={{ padding: 0 }}><BatchRow view={v} onOpen={() => {}} compact /></Card>)}</div></Page></K.Shell></PhoneFrame></div>
          </Sec>

          <Sec id="controls" title="Controls" intro="Native iOS behaviour for toggles, segmented controls and steppers; shadcn anatomy for fields, tabs and selects. Labels are always visible; errors name the problem and the recovery.">
            <div className="ds-two">
              <Spec>
                <Field label="Phone number" help="We send a 6-digit code by SMS." htmlFor="ph"><Input id="ph" icon="phone" inputMode="tel" defaultValue="+91 98230 44118" /></Field>
                <Field label="One-time code"><OTP value={otp} onChange={setOtp} /></Field>
                <Field label="Floor price, snacks" error="The floor cannot go below 30% of MRP. Raise it or ask Anita to change the rule." htmlFor="fl"><Input id="fl" defaultValue="25%" aria-invalid="true" /></Field>
                <Field label="Search batches"><SearchField value={q} onChange={setQ} placeholder="Batch, product, distributor" /></Field>
              </Spec>
              <Spec>
                <div className="row between"><span>Daily 09:00 Watcher run</span><Switch checked={sw} onChange={setSw} label="Daily Watcher run" /></div>
                <div className="row between"><span>Units to order</span><Stepper value={qty} onChange={setQty} step={12} min={12} max={120} label="units" /></div>
                <Field label="Channel" htmlFor="chs"><Select id="chs" defaultValue="kirana"><option value="kirana">Kirana cluster push</option><option value="expiresoon">ExpireSoon listing</option><option value="foodbank">Food bank donation</option></Select></Field>
                <Field label="Note to the distributor" htmlFor="nt"><Textarea id="nt" placeholder="Hindi or English" /></Field>
                <Check checked={chk} onChange={setChk}>Also email the document pack to finance</Check>
                <Segmented options={[{ id: "day", label: "Day" }, { id: "week", label: "Week" }, { id: "quarter", label: "Quarter" }]} value={seg} onChange={setSeg} label="Range" />
                <Tabs tabs={[{ id: "label", label: "Label" }, { id: "plan", label: "Plan", badge: 1 }, { id: "exec", label: "Execution" }, { id: "papers", label: "Papers" }]} value={tab} onChange={setTab} />
              </Spec>
            </div>
          </Sec>

          <Sec id="data" title="Data and tables" intro="Tabular figures, right-aligned money, sortable headers, a hairline between rows; the Valuer's chart always has this table view beside it.">
            <ChannelTable rows={D.PLAN.rows} chosen={D.PLAN.lines.map(l => l.id)} />
            <div className="ds-grid">
              <Tile label="At risk, at MRP" icon="triangle-alert"><Money value={hero.assess.atRiskMRP} size="m" roll from={0} /></Tile>
              <Tile label="Recovered, last 30 days" icon="indian-rupee" live><Money value={186420} size="m" roll from={0} /></Tile>
              <Tile label="GST credit protected" icon="badge-check"><Money value={22370} size="m" /></Tile>
              <Tile label="Kept out of landfill" icon="leaf" foot="1,624 kg · indicative factors"><span className="num m">1.6<span style={{ fontSize: "0.5em" }}> t</span></span></Tile>
            </div>
          </Sec>

          <Sec id="overlays" title="Sheets, alerts, pushes" intro="Every human moment arrives as a push; tapping it opens the sheet where the decision lives.">
            <OverlaysDemo />
          </Sec>

          <Sec id="tracker" title="The tracker" intro="Horizontal on wide screens, vertical in a sheet on phones, the way delivery apps show an order's stops. The human stop pulses amber when it waits for you.">
            <div className="ds-two">
              {app.bp === "phone" ? <Spec label="Compact, on phones (tap for every stop)"><TrackerCompact done={5} current={5} /></Spec> : <Spec label="Horizontal"><Tracker stages={D.STAGES.map(s => ({ id: s.id, title: s.title, human: s.human }))} done={5} current={5} times={K.STAGE_TIMES} /></Spec>}
              <Spec label="Vertical"><VTracker items={D.STAGES.slice(3, 8).map(s => ({ id: s.id, title: s.title, text: s.money, time: K.STAGE_TIMES[s.id], human: s.human }))} done={2} current={2} /></Spec>
            </div>
          </Sec>

          <Sec id="agents" title="Agents at work" intro="Each hand-off is a row: who, what, the tool calls, the result. Gaps between rows are drawn to the clock, so a long wait looks long.">
            <Card><AgentFeed events={D.EVENTS.slice(0, 8)} people={D.PEOPLE} live={4} /></Card>
            <CodeBlock code={`POST /v1/listings\n{\n  "sku": "MF-MC-150",\n  "batch": "MF-2409-117",\n  "units": 772,\n  "price": 15.00,\n  "reserve": 13.50,\n  "best_before": "2026-11-18",\n  "label_photo": "gs://smart-clearance/labels/b4.jpg"\n}\n\nHTTP/1.1 201 Created\n{ "id": "ES-24117", "status": "live" }`} />
          </Sec>

          <Sec id="charts" title="Map and charts" intro="A schematic map, never a political one; charts with one axis, fixed series order, direct labels and hover tooltips.">
            <div className="ds-two"><ClusterMap kiranas={D.KIRANAS} orderedCount={9} route vanProgress={0.4} height={300} /><Card><ChannelBars rows={D.PLAN.rows} chosen={["kirana", "expiresoon"]} /></Card></div>
            <HaulLine progress={0.55} />
            <div className="ds-two"><Card><TrendChart weeks={D.QUARTER.weeks} /></Card><Card className="stack"><span className="card-title">Where the units went, {D.QUARTER.label}</span><MixBar mix={D.QUARTER.mix} names={CH_NAMES} /></Card></div>
          </Sec>

          <Sec id="feedback" title="Feedback" intro="Skeletons in the ground's own tints, the iOS spinner, progress that scales instead of resizing, empty states that teach the next step.">
            <div className="ds-grid">
              <Spec label="Loading"><div className="stack tight"><Skeleton w="60%" h={16} /><Skeleton /><Skeleton w="82%" /><Skeleton h={44} r={12} /></div><div className="row"><Spinner /><span className="t-footnote muted">Reading the label photo</span></div><Progress value={0.62} label="Orders" /></Spec>
              <Spec label="Empty"><Empty img="sprout-box" title="Nothing at risk today" body="The Watcher checks every batch at 09:00. You will get a push if one cannot make it." action={<Button size="sm" variant="tinted" icon="refresh-cw">Run the Watcher now</Button>} /></Spec>
              <Spec label="Documents"><div className="ds-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>{D.DOCS.slice(0, 4).map(d => <DocCard key={d.id} doc={d} onOpen={() => {}} />)}</div></Spec>
            </div>
          </Sec>
          <Sec id="patterns" title="Screen patterns" intro="Pieces the role screens are built from: the push that starts every human moment, the label read from the shelf, documents that stay on paper in both themes, ExpireSoon in its own look, and the kirana offer in Hindi.">
            <div className="ds-grid">
              <Spec label="Push on the lock screen"><div className="phone-holder"><div style={{ width: 216, height: 452 }}><PhoneFrame time="09:05" scale={0.52} dark>{React.createElement(window.SC3_SCREENS.LockScreen, { who: "rakesh", push: D.PUSH.verify, time: "09:05", date: "Friday 2 October", onOpen: () => {} })}</PhoneFrame></div></div></Spec>
              <Spec label="Kirana offer, Hindi first">{React.createElement(window.SC3_SCREENS.OfferCard, { compact: true })}</Spec>
              <Spec label="A document on paper">{React.createElement(window.SC3_SCREENS.Paper, { id: "itc" })}</Spec>
              <Spec label="Another company's surface"><div className="esw"><div className="stack snug">{React.createElement(window.SC3_SCREENS.EsBar)}<div className="row wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">MRP ₹30 · 50% off</span><span className="es-date">Best before 18 Nov 2026 · 47 days</span></div><Button variant="violet" icon="gavel">Bid ₹13.00 for 772</Button></div></div></Spec>
            </div>
          </Sec>
          <p className="t-footnote subtle" style={{ marginTop: 48 }}>Synthetic demo data. Munchly Foods, Glowra, ExpireSoon and every person shown are fictional. Smart-Clearance design system v3.</p>
        </div>
      </main>
    </div>;
  }
  function MarkPlayer() { const [k, setK] = useState(0); return <div className="row" style={{ gap: 28, flexWrap: "wrap" }} key={k}><Mark size={120} play /><div className="stack snug"><Wordmark size={30} play /><div className="ds-row"><Mark size={56} /><Mark size={40} /><Mark size={28} /><Mark size={20} /></div><Button size="sm" icon="rotate-ccw" onClick={() => setK(x => x + 1)}>Draw again</Button></div></div>; }

  function App() { return <ThemeProvider><AppRoot><NoticeHost><Page_ /></NoticeHost></AppRoot></ThemeProvider>; }
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
