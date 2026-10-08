// Smart-Clearance v3 · the trade: Rakesh bhai (distributor), Ganesh ji (kirana), Agrawal ji on ExpireSoon (buyer), Meera (food bank)
(function () {
  const { useState, useEffect, useRef, useMemo, Fragment } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, D = window.SC3_DATA, M = window.SC3_MONEY, Store = window.SC3_STORE, Flow = window.SC3_FLOW, S = window.SC3_SCREENS; const fmt = M.fmt;
  const { cx, Icon, IconButton, Avatar, Badge, Button, Card, List, ListRow, Segmented, Switch, Stepper, Sheet, Product, Empty, Money, Roll, DaysNum, GateChips, Tile, Aura, AgentFeed, ClusterMap, HaulLine, StatusBadge, BatchRow, useApp, useNotice, Mark, WorkspaceMark } = K;
  const { useStore, useRoute, heroModel, Screen, Columns, SectionTitle, Locked } = S;
  const IMG = () => window.SC3_IMG || "system/img/";
  const distOf = me => Object.values(D.DISTRIBUTORS).find(d => d.name === (me && me.org)) || D.DISTRIBUTORS.rakesh;
  const kOf = me => D.KIRANAS.find(k => k.name === (me && me.org)) || D.KIRANAS[0];
  const cartons = u => { const c = Math.floor(u / 24), r = u % 24; return r === 12 ? `${c}½ cartons` : r ? `${c} cartons + ${r}` : `${c} carton${c === 1 ? "" : "s"}`; };
  const ES = D.PLAN.lines.find(l => l.id === "expiresoon"), KL = D.PLAN.lines.find(l => l.id === "kirana");
  const SHOPS = D.KIRANAS.length, CHIPS = D.SKUS.chips;
  const all = h => h.orders.length === SHOPS;

  /* ======================= Rakesh bhai · distributor ======================= */
  // the one-time permission: the agent may act in his name, inside Munchly's floors, and he can pause it
  function PermissionCard() {
    const [busy, setBusy] = useState(false); const [later, setLater] = useState(false); const { toast } = useNotice();
    const allow = () => { setBusy(true); setTimeout(() => { setBusy(false); Flow.act("permit"); toast({ text: "Allowed · you can pause it any time", tone: "ok" }); }, 600); };
    if (later) return <Card className="row wrap" style={{ gap: 14 }}><WorkspaceMark ws={D.WORKSPACE} size={36} /><div className="grow"><b>Munchly is waiting for your permission</b><div className="t-footnote muted">Nothing is listed or offered in your name until you allow it.</div></div><Button variant="secondary" onClick={() => setLater(false)}>Review</Button></Card>;
    return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack snug" style={{ padding: 20 }}>
      <div className="row tight"><WorkspaceMark ws={D.WORKSPACE} size={30} /><span className="t-footnote subtle strong">{D.WORKSPACE.name} · {D.JOURNEY.permissionAsked}</span></div>
      <div className="t-title3">Let Smart-Clearance act for Rakesh Traders</div>
      <div className="stack tight">{D.SETUP.acts.map(t => <div key={t} className="row top t-subhead" style={{ gap: 10 }}><Icon name="check" size={17} stroke={2.4} style={{ color: "var(--primary-text)", marginTop: 2, flex: "none" }} /><span>{t}</span></div>)}</div>
      <p className="t-footnote muted" style={{ margin: 0 }}>Always within Munchly's price floors. Every action shows here, and you can pause any of it. Munchly pays you the gap to the ₹{CHIPS.dp} you paid, so you end whole.</p>
      <div className="row wrap" style={{ gap: 10 }}><Button variant="approve" size="lg" icon="check" loading={busy} onClick={allow}>Allow</Button><Button variant="ghost" size="lg" onClick={() => setLater(true)}>Not now</Button></div>
    </div></motion.div>;
  }
  function ActingFor({ p }) {
    const { toast } = useNotice();
    const flip = () => { Flow.act("pause", !p.paused); toast({ text: p.paused ? "Resumed · the agents carry on" : "Paused · nothing more happens in your name", tone: "ok" }); };
    return <Card className="row wrap" style={{ gap: 12 }}><span className={cx("icontile", p.paused ? "amber" : "")} style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name={p.paused ? "circle-pause" : "handshake"} size={19} /></span><div className="grow" style={{ minWidth: 0 }}><b>{p.paused ? "Paused: nothing happens in your name" : "Smart-Clearance acts for you"}</b><div className="t-footnote muted">{p.paused ? "Listings, offers and invoice drafts wait until you resume." : `Inside Munchly's floors · since ${p.at} · listings, scheme offers, invoice drafts, dispatch slots`}</div></div><Button variant={p.paused ? "primary" : "secondary"} size="sm" icon={p.paused ? "play" : "pause"} onClick={flip}>{p.paused ? "Resume" : "Pause"}</Button></Card>;
  }
  // what he receives and what he paid: the price support makes the two equal
  function EndWhole({ settled }) {
    const recv = KL.gross + D.AWARD.gross + D.SUPPORT.total; const paid = D.PLAN.units * CHIPS.dp + D.SUPPORT.van + D.SUPPORT.fee;
    return <Card className="stack snug">
      <div className="card-head"><span className="card-title">You end whole</span><Badge tone={settled ? "green" : undefined} icon={settled ? "check" : "clock"}>{settled ? "credit note issued" : "on the plan"}</Badge></div>
      <div className="stack tight t-subhead">
        {[[`From ${SHOPS} kiranas (${KL.units} packets)`, KL.gross], [`From ${D.BUYER.name} (${ES.units} packets)`, D.AWARD.gross], ["Price-support credit note from Munchly", D.SUPPORT.total]].map(([k, v]) => <div key={k} className="row between"><span>{k}</span><span className="tnum">{fmt.inr(v)}</span></div>)}
        <div className="hairline" style={{ margin: "4px 0" }} />
        <div className="row between"><b>What you receive</b><span className="tnum strong">{fmt.inr(recv)}</span></div>
        <div className="row between"><span>What you paid: {fmt.num(D.PLAN.units)} × ₹{CHIPS.dp}, the van and the listing fee</span><span className="tnum">{fmt.inr(-paid)}</span></div>
        <div className="row between"><b>Your gain or loss</b><span className="tnum strong">{fmt.inr(Math.round(recv - paid))}</span></div>
      </div>
      <span className="t-caption subtle">Instead of waiting weeks for an expiry claim, with no claim paperwork.</span>
    </Card>;
  }
  function InvoiceDraft({ h }) {
    const inv = D.INVOICE; const { toast } = useNotice();
    return <Card className="row wrap" style={{ gap: 14 }}><span className="icontile"><Icon name="receipt" size={17} stroke={2} /></span><div className="grow" style={{ minWidth: 0 }}><b>Invoice {inv.no} to {D.BUYER.name}</b><div className="t-footnote muted">{ES.units} × ₹{D.COUNTER.price.toFixed(2)} + IGST {inv.gstPct}% · {fmt.inr(inv.total)} · drafted by the Paperwork agent for you</div></div>{h.invoiceIssued ? <Badge tone="green" icon="check">issued from Tally</Badge> : <Button variant="primary" size="sm" icon="check" onClick={() => { Flow.act("issueInvoice"); toast({ text: "Marked issued from Tally", tone: "ok" }); }}>Issue from Tally</Button>}</Card>;
  }
  function DistHome({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const app = useApp();
    const dist = distOf(me); const hero = dist.id === "rakesh"; const perm = s.setup.permission;
    const mine = D.BATCHES.filter(b => b.distributor === dist.id).map(b => { const v = D.batchView(b); if (b.hero) v.phase = heroModel(s).view.phase; if (b.second) v.phase = "executing"; return v; });
    const units = h.orders.reduce((t, o) => t + o.units, 0);
    const approved = ["approved", "executing", "dispatched", "settled", "cleared"].includes(h.phase);
    const settled = ["settled", "cleared"].includes(h.phase);
    // live (SC-73): a day with nothing asked of the distributor
    const live = S.useLive();
    if (live && live.quiet) return <S.Live.DistQuiet me={me} dist={dist} perm={hero ? (perm ? <ActingFor p={perm} /> : <PermissionCard />) : null} />;
    return <Screen me={me} title="Today" sub={`${dist.name} · ${dist.godown}, ${dist.city}`}>
      <div className="stack" style={{ gap: 16 }}>
        {hero && !perm && <PermissionCard />}
        {hero && perm && <ActingFor p={perm} />}
        {!hero && <Card className="row wrap" style={{ gap: 14 }}><Product name="godown" size={72} /><div className="grow"><b>Nothing to do today</b><div className="t-footnote muted">No photo requests, scheme orders or marketplace lots for {dist.name} right now. The Watcher checks your stock every morning at 09:00.</div></div></Card>}
        {hero && h.photo.status === "requested" && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bezel"><div className="card raised stack snug" style={{ padding: 20 }}>
          <div className="row tight"><Mark size={30} /><span className="t-footnote subtle strong">Smart-Clearance · {D.PUSH.verify.at}</span></div>
          <div className="t-title3">{D.PUSH.verify.title}</div>
          <p className="t-body" style={{ margin: 0 }}>{D.PUSH.verify.body}</p>
          <div className="row" style={{ gap: 12 }}><Product name="phone-scan" size={72} /><span className="t-footnote muted">Shelf B4 · one carton of Masala Chips 150 g · batch MF-2409-117</span></div>
          <Button variant="primary" size="lg" icon="camera" block onClick={() => go("photo")}>Open camera</Button>
        </div></motion.div>}
        {hero && ["reading", "verified"].includes(h.photo.status) && !approved && <Card className="row" style={{ gap: 14 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "check" : "scan-line"} size={19} stroke={2.2} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Label verified · thank you" : "Photo sent · reading the label"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "Batch, dates and MRP match your DMS record. Munchly gets a plan in a few minutes." : "Sent at 09:19. Nothing else needed from you."}</div></div></Card>}
        {hero && approved && !settled && <Card className="stack snug">
          <div className="card-head"><span className="card-title">Munchly's plan for your Masala Chips</span><Badge tone="green" icon="check">approved 09:40</Badge></div>
          <div className="stack tight t-subhead">
            <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-kirana)" }} /><span><b>{KL.units} packets to your kiranas</b> on the scheme: ₹{KL.packPrice.toFixed(2)} a pack, 2 free with every 10, delivered on your {D.JOURNEY.van.day} round.</span></div>
            <div className="row top" style={{ gap: 10 }}><span className="dotmark" style={{ background: "var(--ch-expiresoon)" }} /><span><b>{ES.units} on ExpireSoon in your name</b> at ₹15, hidden from buyers in Munchly's territories. The buyer collects with his own truck.</span></div>
          </div>
        </Card>}
        {hero && approved && <div style={{ display: "grid", gap: 16, gridTemplateColumns: app.bp === "phone" ? "minmax(0,1fr)" : "repeat(2, minmax(0,1fr))" }}>
          <Card interactive className="stack snug" onClick={() => go("van")} role="button" tabIndex={0} onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go("van"))}>
            <div className="card-head"><span className="row tight"><span className="icontile"><Icon name="truck" size={17} stroke={2} /></span><span className="card-title">{D.JOURNEY.van.day} van round</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
            <div className="row base" style={{ gap: 8 }}><span className="num m"><Roll value={h.orders.length} /></span><span className="muted">shops · {cartons(units)}</span></div>
            <span className="t-footnote subtle">{h.van.status === "done" ? `Delivered · all ${SHOPS} shops` : h.orders.length ? "Orders from the Masala Chips scheme join this round" : "Scheme orders will appear here"}</span>
          </Card>
          <Card interactive className="stack snug" onClick={() => go("van")} role="button" tabIndex={0} onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go("van"))}>
            <div className="card-head"><span className="row tight"><span className="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span className="card-title">{D.BUYER.city} lot · ExpireSoon</span></span><Icon name="chevron-right" size={18} className="subtle" /></div>
            <div className="row base" style={{ gap: 8 }}><span className="num m">{ES.units}</span><span className="muted">units · {cartons(ES.units)}</span></div>
            <span className="t-footnote subtle">{h.truck.status === "dispatched" ? `Collected by ${D.BUYER.name}'s truck` : h.award ? `Sold at ₹${D.COUNTER.price.toFixed(2)} · token ${fmt.inr(D.AWARD.token)} paid` : h.listing ? "Listed at ₹15 in your name · waiting for a buyer" : "Not listed"}</span>
          </Card>
        </div>}
        {hero && settled && <InvoiceDraft h={h} />}
        {hero && approved && <EndWhole settled={settled} />}
        <SectionTitle sub="From your nightly DMS export">Your stock</SectionTitle>
        <div className="list">{mine.map(v => <BatchRow key={v.id} view={v} compact={app.bp === "phone"} onOpen={() => {}} />)}</div>
      </div>
    </Screen>;
  }

  function CameraScreen({ me, realCamera }) {
    if (distOf(me).id !== "rakesh") return <Screen me={me} title="Label photo" sub="Requests from the Vision agent"><Card style={{ maxWidth: 560 }}><Empty img="phone-scan" title="No photo requests" body="When a batch needs checking, Vision asks for one picture of a carton label here." /></Card></Screen>;
    return <CameraInner me={me} realCamera={realCamera} />;
  }
  // the label photo (SC-80, option A): the frame shows what Vision needs, and under it the two ways, Take a photo and
  // Upload a photo, the primary following the device. A phone takes the photo with its own camera app; on the live
  // workspace a laptop opens its camera in the frame. A photo in hand shows whole before it goes. What is sent is what
  // backend-api takes, a JPEG, PNG or WebP under 8 MB; naming the types makes an iPhone hand over its HEIC as a JPEG
  const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"], PHOTO_MAX_MB = 8;
  const PHOTO_RULE = `JPEG, PNG or WebP, under ${PHOTO_MAX_MB}\u00a0MB`;
  const CAM_BLOCKED = "The camera is blocked for this page. Allow it in the browser's site settings, or upload a photo.";
  const CAM_NONE = "No camera was found. Upload a photo instead.";
  function CameraInner({ me, realCamera }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const reduce = useReducedMotion(); const app = useApp();
    const phoneCam = useRef(null), files = useRef(null), video = useRef(null), stream = useRef(null);
    const [shot, setShot] = useState(null); const [flash, setFlash] = useState(false); const [sending, setSending] = useState(false);
    const [camOn, setCamOn] = useState(false); const [camLive, setCamLive] = useState(null); const [over, setOver] = useState(false);
    const [err, setErr] = useState(null); const [ratio, setRatio] = useState(null);
    const sent = h.photo.status === "reading" || h.photo.status === "verified";
    // live (SC-73): the photo goes to the workspace's storage, and Send fills as it goes
    const live = S.useLive(); const uploading = !!live && live.uploads.photo != null;
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    const desk = !coarse && app.bp !== "phone";
    const stopCam = () => { if (stream.current) stream.current.getTracks().forEach(t => t.stop()); stream.current = null; setCamLive(null); setCamOn(false); };
    useEffect(() => () => { if (stream.current) stream.current.getTracks().forEach(t => t.stop()); }, []);
    // a photo picked, dropped or taken: refused with its reason if backend-api would refuse it
    const use = (f, how) => {
      setOver(false); if (!f) return;
      if (!PHOTO_TYPES.includes(f.type)) { setErr("That file is not a photo Vision can read. Send a JPEG, PNG or WebP."); return; }
      if (f.size >= PHOTO_MAX_MB * 1048576) { setErr(`That photo is ${(f.size / 1048576).toFixed(1)}\u00a0MB. Send one under ${PHOTO_MAX_MB}\u00a0MB.`); return; }
      setErr(null); setRatio(null); setShot({ url: URL.createObjectURL(f), how, name: f.name });
    };
    const picked = how => e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; use(f, how); };
    // a laptop's camera in the frame (the rear one where there is one); refused or missing, it says so
    const openCam = async () => {
      const md = navigator.mediaDevices; if (!md || !md.getUserMedia) { setErr(CAM_NONE); return; }
      setCamOn(true);
      try { const st = await md.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); stream.current = st; setCamLive(st); }
      catch (e) { stopCam(); setErr(e && e.name === "NotAllowedError" ? CAM_BLOCKED : CAM_NONE); }
    };
    const feed = el => { video.current = el; if (el && camLive && el.srcObject !== camLive) { el.srcObject = camLive; el.play().catch(() => {}); } };
    const blink = () => { setFlash(true); setTimeout(() => setFlash(false), reduce ? 0 : 180); };
    const take = () => {
      setErr(null);
      if (realCamera && coarse && phoneCam.current) { phoneCam.current.click(); return; }
      if (realCamera && live) { openCam(); return; }
      // the prototype's stand-in: the shelf as the photo
      blink(); setTimeout(() => setShot({ demo: true, how: "camera" }), reduce ? 0 : 180);
    };
    const shutter = () => {
      const v = video.current; if (!v || !v.videoWidth) return;
      const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0);
      blink(); c.toBlob(b => { stopCam(); if (b) use(new File([b], "label-photo.jpg", { type: "image/jpeg" }), "camera"); }, "image/jpeg", 0.92);
    };
    const upload = () => { setErr(null); files.current && files.current.click(); };
    const again = () => { setShot(null); setRatio(null); (shot && shot.how === "camera" ? take : upload)(); };
    const drop = sent || uploading ? {} : { onDragOver: e => { e.preventDefault(); setOver(true); }, onDragLeave: () => setOver(false), onDrop: e => { e.preventDefault(); use(e.dataTransfer.files && e.dataTransfer.files[0], "upload"); } };
    const send = () => { if (live) { live.sendPhoto(() => Flow.act("sendPhoto")); return; } setSending(true); setTimeout(() => { setSending(false); Flow.act("sendPhoto"); }, 700); };
    const busy = sent || uploading;
    const photo = shot && !shot.demo;
    const caption = shot ? "Check that you can read the batch, both dates and the MRP." : camOn ? "Hold the label flat to the camera, close enough to read." : desk ? `${PHOTO_RULE}. Or drop a photo on the frame.` : `Take a photo opens your camera. ${PHOTO_RULE}.`;
    return <Screen me={me} title="Label photo" sub="Batch MF-2409-117 · shelf B4" back="Today">
      <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <div className={cx("cam", camOn && "landscape")} style={photo && ratio ? { aspectRatio: String(ratio) } : undefined} {...drop}>
          {photo ? <motion.img key={shot.url} className="cam-feed whole" src={shot.url} alt="Your photo of the carton label" onLoad={e => setRatio(Math.max(0.75, Math.min(1.5, e.target.naturalWidth / e.target.naturalHeight)))} initial={reduce ? false : { opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }} />
            : camOn ? <video ref={feed} className="cam-feed" playsInline muted aria-label="The laptop's camera" />
            : <S.LabelShot cover dim={!shot && !busy} />}
          {!shot && !busy && <><div className="cam-frame" aria-hidden="true"><i /><i /><i /><i /></div><div className="cam-hint">{camOn ? (camLive ? "Fit one carton label in the frame" : "Starting the camera…") : "Like this: one carton label, close up"}</div></>}
          {!shot && !camOn && !busy && <span className="cam-tag">Example</span>}
          {camOn && <span className="cam-tag on"><i aria-hidden="true" />Laptop camera</span>}
          {shot && !busy && <span className="cam-tag">{photo && shot.how === "upload" && shot.name ? shot.name : "Your photo"}</span>}
          <AnimatePresence>{over && !busy && <motion.div key="d" className="cam-drop" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}><span className="cam-drop-in"><Icon name="image" size={22} /><b>Drop the photo to use it</b></span></motion.div>}</AnimatePresence>
          {sent && <div className="cam-hint" style={{ background: "var(--green-700)" }}><Icon name={h.photo.status === "verified" ? "check" : "loader"} size={14} className={h.photo.status === "verified" ? "" : "spin"} /> {h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"}</div>}
          <AnimatePresence>{flash && <motion.div key="f" className="cam-flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />}</AnimatePresence>
          {h.photo.status === "reading" && !reduce && <motion.div aria-hidden="true" className="cam-scan" animate={{ top: ["20%", "76%", "20%"] }} transition={{ duration: 1.6, repeat: 2, ease: "easeInOut" }} />}
        </div>
        {sent ? <Card className="stack snug">
          <div className="row" style={{ gap: 12 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "badge-check" : "scan-line"} size={19} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."}</div></div></div>
          {h.photo.status === "verified" && <List>{[["Batch", "MF-2409-117"], ["Best before", "18 Nov 2026"], ["MRP", "₹30.00"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>}
          <Button variant="secondary" block onClick={() => go("home")}>Back to today</Button>
        </Card> : uploading ? <S.Live.SendFill p={live.uploads.photo} onCancel={() => live.cancelUpload("photo")} />
          : <AnimatePresence mode="wait" initial={false}>
            {shot ? <motion.div key="send" className="row" style={{ gap: 10 }} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}><Button variant="secondary" size="lg" icon={shot.how === "camera" ? "rotate-ccw" : "image"} onClick={again} style={{ flex: "none" }}>{shot.how === "camera" ? "Retake" : "Choose another"}</Button><Button variant="primary" size="lg" block icon="send" loading={sending} onClick={send}>Send photo</Button></motion.div>
              : camOn ? <motion.div key="cam" className="cam-bar" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}><Button variant="ghost" onClick={stopCam}>Cancel</Button><button type="button" className="shutter" aria-label="Take the photo" disabled={!camLive} onClick={shutter}><span /></button><Button variant="ghost" icon="image" onClick={() => { stopCam(); upload(); }}>Upload</Button></motion.div>
              : <motion.div key="two" className="cam-two" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}><Button variant={desk ? "secondary" : "primary"} size="lg" icon="camera" onClick={take}>Take a photo</Button><Button variant={desk ? "primary" : "secondary"} size="lg" icon="upload" onClick={upload}>Upload a photo</Button></motion.div>}
          </AnimatePresence>}
        <input ref={phoneCam} type="file" accept={PHOTO_TYPES.join(",")} capture="environment" onChange={picked("camera")} className="sr-only" tabIndex={-1} aria-hidden="true" />
        <input ref={files} type="file" accept={PHOTO_TYPES.join(",")} onChange={picked("upload")} className="sr-only" tabIndex={-1} aria-hidden="true" />
        {err && !busy ? <p className="cam-alert" role="alert"><Icon name="triangle-alert" size={15} />{err}</p>
          : uploading ? <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>A slow connection only slows the send.</p>
          : !sent && realCamera && <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>{live ? caption : `${caption} In this prototype a stub stands in for Gemini vision and returns the batch record.`}</p>}
      </div>
    </Screen>;
  }

  function VanRoute({ me }) {
    if (distOf(me).id !== "rakesh") return <Screen me={me} title="Van route" sub={distOf(me).cluster}><Card style={{ maxWidth: 560 }}><Empty img="van" title="No scheme orders on the van" body="Orders from Smart-Clearance offers join your next round automatically." /></Card></Screen>;
    return <VanInner me={me} />;
  }
  function VanInner({ me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const reduce = useReducedMotion(); const { toast } = useNotice();
    const units = h.orders.reduce((t, o) => t + o.units, 0); const full = all(h);
    const [p, setP] = useState(h.van.status === "done" ? 1 : 0); const [running, setRunning] = useState(false);
    useEffect(() => { if (h.van.status === "done" && !running) setP(1); }, [h.van.status]);
    const start = () => { setRunning(true); const t0 = performance.now(), dur = reduce ? 10 : 3600; const step = now => { const k = Math.min(1, (now - t0) / dur); setP(k); if (k < 1) requestAnimationFrame(step); else { setRunning(false); Flow.act("vanRound"); toast({ text: `Round done · ${SHOPS} shops, ${cartons(units)}`, tone: "ok" }); } }; requestAnimationFrame(step); };
    const dispatch = () => { Flow.act("dispatch"); toast({ text: `${D.BUYER.city} lot on the buyer's truck · invoice draft next`, tone: "ok" }); };
    const stops = D.KIRANAS.map(k => ({ ...k, ordered: h.orders.find(o => o.id === k.id) }));
    return <Screen me={me} title="Van route" sub={`${D.JOURNEY.van.depot} · Nagpur, Wardha and Kamptee`} back="Today">
      <Columns sideWidth={380}
        main={<>
          <Card pad={false} style={{ overflow: "hidden" }}><ClusterMap kiranas={D.KIRANAS} orderedCount={h.orders.length} route={h.orders.length > 0} vanProgress={p} height={app.bp === "phone" ? 260 : 380} /></Card>
          <Card className="stack snug">
            <div className="card-head"><span className="card-title">{D.JOURNEY.van.day} round</span><Badge tone={h.van.status === "done" ? "green" : undefined} icon={h.van.status === "done" ? "check" : "calendar"}>{h.van.status === "done" ? "delivered" : `${D.JOURNEY.van.date} · from ${D.JOURNEY.van.leaves}`}</Badge></div>
            <div className="row wrap" style={{ gap: 20 }}><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={h.orders.length} /><span className="subtle" style={{ fontSize: "0.45em" }}> / {SHOPS}</span></span><span className="t-footnote subtle">shops on the round</span></div><div className="stack tight" style={{ gap: 0 }}><span className="num m"><Roll value={units} /></span><span className="t-footnote subtle">packets · {cartons(units)}</span></div></div>
            {h.van.status !== "done" && <Button variant="primary" size="lg" icon="navigation" loading={running} disabled={!full || running} onClick={start}>{full ? "Start the round" : `Waiting for orders · ${h.orders.length} of ${SHOPS}`}</Button>}
            <span className="t-caption subtle">₹{M.RULES.vanPerUnit.toFixed(2)} a packet for the van, repaid by Munchly in the price support.</span>
            <div className="feed" style={{ gap: 10 }}>
              <div className="row top" style={{ gap: 10 }}><Mark size={28} /><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopLeftRadius: 6, background: "var(--fill-2)" }}>{D.PUSH.van.body}<div className="t-caption muted">Outreach agent · Mon 18:00</div></div></div>
              <div className="row top" style={{ gap: 10, justifyContent: "flex-end" }}><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)" }}>{D.JOURNEY.van.reply}<div className="t-caption" style={{ opacity: 0.9 }}>Rakesh bhai · {D.JOURNEY.van.replyAt}</div></div><Avatar person={D.PEOPLE.rakesh} size="sm" /></div>
            </div>
          </Card>
          <div data-anchor="shelf" />
          {(h.van.status === "done" || h.shelf) && <S.ShelfCheck shelf={h.shelf} />}
        </>}
        side={<>
          <div data-anchor="lot" />
          <Card className="stack snug">
            <div className="card-head"><span className="row tight"><span className="icontile violet"><Icon name="package" size={17} stroke={2} /></span><span className="card-title">{D.BUYER.city} lot</span></span><Badge tone={h.truck.status === "dispatched" ? "blue" : h.award ? "green" : "violet"}>{h.truck.status === "dispatched" ? "collected" : h.award ? "sold" : h.listing ? "listed" : "not listed"}</Badge></div>
            <HaulLine progress={h.truck.status === "dispatched" ? (h.phase === "cleared" || h.phase === "settled" ? 1 : 0.55) : 0} />
            <List>{[["Buyer", h.award ? `${D.BUYER.name}, ${D.BUYER.city}` : "—"], ["Units", `${ES.units} · ${cartons(ES.units)}`], ["Price", h.award ? `₹${D.COUNTER.price.toFixed(2)} a packet` : "₹15.00 asked"], ["Token", h.award ? fmt.inr(D.AWARD.token) + " received" : "—"], ["Freight", "the buyer's own truck"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
            {h.truck.status !== "dispatched" && <Button variant="primary" size="lg" icon="truck" disabled={!h.award} onClick={dispatch}>{h.award ? "Load the buyer's truck" : "Load after the award"}</Button>}
            <span className="t-caption subtle">Your staff load it as normal godown work, once the balance lands.</span>
          </Card>
          <div className="stack snug"><SectionTitle sub="In the order they were placed">Stops</SectionTitle>
            <div className="list">{stops.map((k, i) => <div key={k.id} className="list-row" style={{ gridTemplateColumns: "28px minmax(0,1fr) auto" }}><span className="center t-caption strong" style={{ width: 24, height: 24, borderRadius: 99, background: k.ordered ? "var(--primary)" : "var(--fill-2)", color: k.ordered ? "var(--primary-fg)" : "var(--fg-2)" }}>{i + 1}</span><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{k.name}</b><span className="t-caption subtle">{k.area}{k.ordered ? ` · ordered ${k.ordered.at}` : " · not yet"}</span></span><span className="tnum strong t-subhead">{k.ordered ? k.units : "—"}</span></div>)}</div>
          </div>
        </>} />
    </Screen>;
  }

  function DistOrders({ me }) {
    const s = useStore(); const h = s.hero; const hero = distOf(me).id === "rakesh";
    if (!hero) return <Screen me={me} title="Orders" sub="Scheme orders and marketplace sales"><Card style={{ maxWidth: 560 }}><Empty img="van" title="No orders yet" body="Kirana orders from offers and marketplace awards for your stock appear here." /></Card></Screen>;
    const rows = h.orders.slice().reverse().map(o => ({ ...o, k: D.KIRANAS.find(k => k.id === o.id) }));
    return <Screen me={me} title="Orders" sub="Scheme orders and marketplace sales">
      <div className="stack" style={{ gap: 16 }}>
        {h.award && <Card className="row wrap" style={{ gap: 14 }}><span className="icontile violet"><Icon name="shopping-bag" size={17} stroke={2} /></span><div className="grow"><b>{D.BUYER.name}, {D.BUYER.city} · ExpireSoon</b><div className="t-footnote muted">{ES.units} × ₹{D.COUNTER.price.toFixed(2)} · token {fmt.inr(D.AWARD.token)} · balance {fmt.inr(D.AWARD.balance)}, plus {fmt.inr(D.INVOICE.igst)} IGST on your invoice</div></div><Money value={D.AWARD.gross} size="s" decimals /></Card>}
        {h.docs && <InvoiceDraft h={h} />}
        {rows.length ? <div className="list">{rows.map(o => <div key={o.id} className="list-row" style={{ gridTemplateColumns: "minmax(0,1fr) auto" }}><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{o.k.name}</b><span className="t-caption subtle">{o.k.area} · {o.at} · buy 10 get 2</span></span><span className="stack tight" style={{ gap: 0, justifyItems: "end" }}><span className="tnum strong">{o.units} packets</span><span className="t-caption subtle">{cartons(o.units)}</span></span></div>)}</div> : <Card><Empty img="van" title="No scheme orders yet" body="When a kirana taps the offer, the order lands here and joins your next van round." /></Card>}
      </div>
    </Screen>;
  }

  /* ======================= Ganesh ji · kirana ======================= */
  // the scheme: pay the pack price for 10 of every 12, sell all 12 at MRP
  const offerMath = n => { const free = Math.floor(n / 12) * 2, paid = n - free, pack = KL.packPrice; return { n, free, paid, pack, pay: paid * pack, sell: n * CHIPS.mrp, margin: n * CHIPS.mrp - paid * pack }; };
  function OfferCard({ onOpen, compact, shop }) {
    const [en, setEn] = useState(false); const p0 = D.PUSH.offer; const name = shop || "Shree Ganesh Kirana";
    const p = Object.assign({}, p0, { body: p0.body.replace("Shree Ganesh Kirana", name) });
    return <div className="bezel"><div className="card raised" style={{ padding: compact ? 16 : 22, display: "grid", gap: 14 }}>
      <div className="row between"><span className="row tight"><Mark size={28} /><span className="t-footnote subtle strong">Rakesh Traders · {p.at}</span></span><button type="button" className="btn btn-ghost btn-sm" onClick={() => setEn(!en)} aria-pressed={en}>{en ? <span lang="hi">हिन्दी में पढ़ें</span> : "Read in English"}</button></div>
      <div className="row" style={{ gap: 14, alignItems: "center" }}><Product name="pack-chips" size={compact ? 76 : 96} float /><div className="stack tight" style={{ gap: 4 }}><div className={cx("t-title2", !en && "hi")} lang={en ? "en" : "hi"}>{en ? "Today's special offer" : p.title}</div><div className="row base" style={{ gap: 8 }}><span className="num m">₹{KL.packPrice.toFixed(2)}</span><span className="subtle t-subhead">a packet · MRP ₹{CHIPS.mrp}</span></div><span className="row tight wrap"><Badge tone="green" icon="gift">{en ? "Buy 10, get 2 free" : <span lang="hi">10 लो, 2 मुफ़्त</span>}</Badge><Badge icon="clock">{en ? "48 hours" : <span lang="hi">सिर्फ़ 48 घंटे</span>}</Badge></span></div></div>
      <p className={cx("t-body", !en && "hi")} lang={en ? "en" : "hi"} style={{ margin: 0, lineHeight: 1.55 }}>{en ? p.en : p.body}</p>
      {onOpen && <Button variant="primary" size="lg" block iconRight="arrow-right" onClick={onOpen}>{en ? "See the offer" : <span lang="hi">ऑफर देखें</span>}</Button>}
    </div></div>;
  }
  function RetailHome({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const k = kOf(me); const mine = h.orders.find(o => o.id === k.id);
    return <Screen me={me} title="Offers" sub={`${k.name} · ${k.area}, Nagpur`}>
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {h.offer ? (mine ? <Card className="stack snug"><div className="row" style={{ gap: 14 }}><Product name="pack-chips" size={64} /><div className="grow"><b>Ordered · {mine.units} packets</b><div className="t-footnote muted">Masala Chips 150 g · placed {mine.at} · comes on {D.JOURNEY.van.day}'s van</div></div><Badge tone="green" icon="check">confirmed</Badge></div></Card> : <OfferCard shop={k.name} onOpen={() => go("offer")} />)
          : <Card><Empty img="kirana" title="No offers today" body="Rakesh Traders' schemes arrive here as a notification, in Hindi, ready to order in one tap." /></Card>}
        <SectionTitle>Your shop</SectionTitle>
        <List>{[["Distributor", "Rakesh Traders, Nagpur"], ["Van day", D.JOURNEY.van.day], ["Unsold scheme packs", `back to the salesman until ${fmt.day(D.RETURN_BY)}`], ["Language", "हिन्दी · English"]].map(([k, v]) => <ListRow key={k} title={k} value={k === "Language" ? <span lang="hi">{v}</span> : v} />)}</List>
      </div>
    </Screen>;
  }
  function OfferDetail({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const k = kOf(me); const [n, setN] = useState(k.units); const [busy, setBusy] = useState(false); const m = offerMath(n);
    const mine = h.orders.find(o => o.id === k.id);
    const order = () => { setBusy(true); setTimeout(() => { setBusy(false); Store.update(st => { Flow.A.order(st, k.id); const o = st.hero.orders.find(x => x.id === k.id); if (o) o.units = n; }); }, 650); };
    return <Screen me={me} title="Masala Chips 150 g" sub="Rakesh Traders · scheme for 48 hours" back="Offers">
      <div className="stack" style={{ gap: 16, maxWidth: 620 }}>
        {h.offer ? <OfferCard compact shop={k.name} /> : <Card><Empty img="kirana" title="No offer right now" body="This offer has not been sent to your shop yet." /></Card>}
        {!h.offer ? null : mine ? <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card stack" style={{ padding: 22, justifyItems: "center", textAlign: "center" }}>
          <span className="icontile" style={{ width: 56, height: 56, borderRadius: 18 }}><Icon name="check" size={28} stroke={2.4} /></span>
          <div className="t-title2 hi" lang="hi">ऑर्डर हो गया</div>
          <span className="muted">{mine.units} packets on {D.JOURNEY.van.day}'s van · pay on delivery</span>
          <Money value={offerMath(mine.units).margin} size="m" style={{ color: "var(--primary-text)" }} /><span className="t-footnote subtle">your margin at MRP on this order</span>
          <Button variant="secondary" onClick={() => go("home")}>Done</Button>
        </motion.div> : <Card className="stack" style={{ gap: 16 }}>
          <div className="row between"><div className="stack tight" style={{ gap: 0 }}><b>How many packets?</b><span className="t-footnote subtle">In twelves · your share is up to {k.units}</span></div><Stepper value={n} onChange={setN} min={12} max={k.units} step={12} label="Packets" /></div>
          <div className="stack tight">{[["You pay", `${m.paid} × ₹${m.pack.toFixed(2)}`, fmt.inr(m.pay)], ["Free packets", "2 with every 10", `${m.free}`], ["You sell at MRP", `${n} × ₹${CHIPS.mrp}`, fmt.inr(m.sell)]].map(([k, sub, v]) => <div key={k} className="row between t-subhead"><span>{k} <span className="subtle t-footnote">{sub}</span></span><span className="tnum strong">{v}</span></div>)}</div>
          <div className="row between" style={{ padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><span className="stack tight" style={{ gap: 0 }}><b>Margin today</b><span className="t-footnote muted">₹{(m.pay / n).toFixed(2)} a packet in effect, sold at ₹{CHIPS.mrp}</span></span><Money value={m.margin} size="s" roll style={{ color: "var(--primary-text)" }} /></div>
          <Button variant="primary" size="xl" block loading={busy} onClick={order}><span className="hi" lang="hi">ऑर्डर करें</span> · {n} packets</Button>
          <span className="t-caption subtle" style={{ textAlign: "center" }}>Best before 18 Nov 2026 · 47 days on every packet · unsold packs go back to the salesman until {fmt.day(D.RETURN_BY)}</span>
        </Card>}
      </div>
    </Screen>;
  }
  function RetailOrders({ me }) {
    const s = useStore(); const k = kOf(me); const mine = s.hero.orders.find(o => o.id === k.id);
    return <Screen me={me} title="Orders" sub={k.name}>
      {mine ? <div className="list" style={{ maxWidth: 620 }}><div className="list-row" style={{ gridTemplateColumns: "48px minmax(0,1fr) auto" }}><Product name="pack-chips" size={44} /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">Masala Chips 150 g · {mine.units} packets</b><span className="t-caption subtle">{mine.at} · buy 10 get 2 · {D.JOURNEY.van.day}'s van</span></span><Badge size="sm" tone={s.hero.van.status === "done" ? "green" : undefined}>{s.hero.van.status === "done" ? "delivered" : "on the round"}</Badge></div></div> : <Card style={{ maxWidth: 620 }}><Empty icon="shopping-basket" title="No orders yet" body="Orders you place from an offer show here with the van day." /></Card>}
    </Screen>;
  }

  /* ======================= Agrawal ji · ExpireSoon (another company's marketplace) ======================= */
  const OTHER_LISTINGS = D.MARKET.lots;
  function EsBar({ me, title }) {
    return <div className="es-top"><span className="row tight"><span className="es-logo" aria-hidden="true"><Icon name="hourglass" size={16} stroke={2.2} /></span><span className="es-word">ExpireSoon</span></span><span className="t-caption subtle es-tag">Near-expiry B2B marketplace · dates visible</span><span className="grow" />{title}</div>;
  }
  function EsDate({ days, date }) { return <span className="es-date">{date ? date + " · " : ""}{days} days</span>; }
  function ListingCard({ l, onOpen, hero }) {
    return <button type="button" className="es-card" onClick={onOpen}>
      <div className="es-thumb">{hero ? <Product name="pack-chips" size={92} /> : <Icon name={l.icon} size={38} stroke={1.5} />}</div>
      <div className="stack tight" style={{ gap: 4, padding: "12px 14px 14px" }}>
        <b className="t-subhead" style={{ lineHeight: 1.25 }}>{l.name}</b>
        <span className="row base" style={{ gap: 6 }}><span className="es-price">₹{l.price}</span><span className="t-caption subtle">MRP ₹{l.mrp} · {Math.round((1 - l.price / l.mrp) * 100)}% off</span></span>
        <span className="row tight wrap"><EsDate days={l.days} />{hero && <Badge size="sm" tone="violet" icon="badge-check">label verified</Badge>}</span>
        <span className="t-caption subtle">{fmt.num(l.units)} units · {l.seller}</span>
      </div>
    </button>;
  }
  function Market({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute(); const app = useApp(); const [q, setQ] = useState(""); const [cat, setCat] = useState("all");
    const hero = h.listing && { id: D.JOURNEY.listing.id, name: "Munchly Masala Chips 150 g", units: ES.units, price: 15, mrp: 30, days: 47, seller: "Rakesh Traders, Nagpur" };
    const list = [hero, ...OTHER_LISTINGS].filter(Boolean).filter(l => (!q || l.name.toLowerCase().includes(q.toLowerCase())) && (cat === "all" || (cat === "snacks" ? /chips|biscuit|noodle/i.test(l.name) : cat === "staples" ? /atta|milk/i.test(l.name) : true)));
    return <div className="esw"><Screen me={me} title="Marketplace" sub={`Lots for ${D.BUYER.city} · every listing shows its dates`} hideLarge={false}>
      <div className="stack" style={{ gap: 16 }}>
        <EsBar />
        <div className="row wrap" style={{ gap: 10 }}><div className="grow" style={{ minWidth: 200 }}><K.SearchField value={q} onChange={setQ} placeholder="Search lots" /></div><K.Segmented options={[{ id: "all", label: "All" }, { id: "snacks", label: "Snacks" }, { id: "staples", label: "Staples" }]} value={cat} onChange={setCat} label="Category" /></div>
        {hero && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="es-feature" onClick={() => go("listing")}>
          <Product name="pack-chips" size={app.bp === "phone" ? 96 : 132} float />
          <div className="stack tight grow" style={{ gap: 6 }}><span className="row tight wrap"><Badge tone="violet" solid size="sm">new · {h.listing.at}</Badge><Badge size="sm" tone="violet" icon="badge-check">label photo verified</Badge></span><div className="t-title2">Munchly Masala Chips 150 g · {ES.units} units</div><span className="row base wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">MRP ₹30 · 50% off</span><EsDate days={47} date="Best before 18 Nov 2026" /></span><span className="t-footnote subtle">Rakesh Traders, Nagpur · verified seller · dispatch {D.MARKET.dispatchHours} h after balance</span></div>
          <Button variant="violet" iconRight="arrow-right">View lot</Button>
        </motion.div>}
        <div className="es-grid">{list.filter(l => l !== hero).map(l => <ListingCard key={l.id} l={l} onOpen={() => {}} />)}</div>
        <p className="t-caption subtle" style={{ margin: 0 }}>ExpireSoon is mocked in this prototype; the other lots are illustrative.</p>
      </div>
    </Screen></div>;
  }
  function ListingView({ readOnly, me }) {
    const s = useStore(); const h = s.hero; const app = useApp(); const [price, setPrice] = useState(13); const [msg, setMsg] = useState("");
    const last = h.bids[h.bids.length - 1]; const open = !last || last.status === "declined";
    const token = Math.round(price * ES.units * M.RULES.tokenPct * 100) / 100; const inv = D.INVOICE;
    const place = () => Flow.act("bid", price);
    const accept = () => Flow.act("accept");
    if (!h.listing) return <Card><Empty icon="hourglass" title="Not listed yet" body="The Lister posts this lot the moment the plan is approved." /></Card>;
    return <div style={{ display: "grid", gap: 16, gridTemplateColumns: app.bp === "desktop" && !readOnly ? "minmax(0, 1.2fr) minmax(0, 1fr)" : "minmax(0,1fr)", alignItems: "start" }}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="es-gallery"><div className="es-thumb big"><Product name="pack-chips" size={app.bp === "phone" ? 150 : 190} float /></div><div className="es-thumb big" style={{ padding: 0, overflow: "hidden", containerType: "inline-size" }}><S.LabelPhoto status="verified" /></div></div>
        <div className="stack tight"><div className="t-title2">Munchly Masala Chips 150 g · {ES.units} units</div><span className="row base wrap" style={{ gap: 8 }}><span className="es-price lg">₹15</span><span className="muted">a packet · MRP ₹30 · 50% off</span></span><span className="row tight wrap"><EsDate days={47} date="Best before 18 Nov 2026" /><Badge size="sm" tone="violet" icon="badge-check">label photo verified</Badge></span></div>
        <List>{[["Seller", "Rakesh Traders, Nagpur · verified"], ["Visible to", "buyers outside Munchly's distributor territories"], ["Dispatch", `${D.MARKET.dispatchHours} h after the balance · buyer pays freight`], ["Lot", `${cartons(ES.units)} · 24 × 150 g a carton`], ["Minimum order", `${D.MARKET.minOrder} units`], ["Listing", h.listing.id]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>
      </div>
      <div className="stack" style={{ gap: 16 }}>
        {!readOnly && (h.award ? <Card className="stack snug"><div className="row" style={{ gap: 12 }}><span className="icontile violet" style={{ width: 44, height: 44, borderRadius: 14 }}><Icon name="badge-check" size={22} /></span><div className="grow"><b>Lot won at ₹{D.COUNTER.price.toFixed(2)}</b><div className="t-footnote muted">Token {fmt.inr(D.AWARD.token)} paid · {fmt.inr(D.AWARD.balance)} of the bid and {fmt.inr(inv.igst)} IGST due in {D.MARKET.balanceHours} h</div></div></div><List>{[[`${ES.units} × ₹${D.COUNTER.price.toFixed(2)}`, fmt.inr2(inv.taxable)], [`IGST ${inv.gstPct}%, Maharashtra to Chhattisgarh`, fmt.inr2(inv.igst)], ["Round off", fmt.inr2(inv.roundOff)], ["Invoice total", fmt.inr2(inv.total)]].map(([k, v]) => <ListRow key={k} title={k} value={<span className="tnum strong">{v}</span>} />)}</List><span className="t-caption subtle">Rakesh Traders issues the invoice from its own Tally.</span></Card>
          : open ? <Card className="stack snug">
            <div className="card-head"><span className="card-title">Place a bid</span><span className="t-caption subtle">ask ₹15.00</span></div>
            <div className="row between"><span className="stack tight" style={{ gap: 0 }}><b>Your price a packet</b><span className="t-footnote subtle">for all {ES.units} units</span></span><Stepper value={price} onChange={setPrice} min={10} max={14} step={0.5} label="Bid price" format={v => "₹" + v.toFixed(2)} /></div>
            <div className="row between t-subhead"><span>15% token on your bid</span><span className="tnum strong">{fmt.inr2(token)}</span></div>
            <Button variant="violet" size="lg" block icon="gavel" onClick={place}>Bid ₹{price.toFixed(2)} for {ES.units}</Button>
            <span className="t-caption subtle">Balance in {D.MARKET.balanceHours} h. The seller's agent replies in about a minute.</span>
          </Card> : <Card className="stack snug"><div className="card-head"><span className="card-title">Your bid</span><Badge tone={last.status === "countered" ? "violet" : undefined} dot live={last.status === "placed"}>{last.status === "placed" ? "waiting for the seller" : last.status}</Badge></div>
            <div className="row base" style={{ gap: 8 }}><span className="es-price lg">₹{last.price.toFixed(2)}</span><span className="muted">→ counter ₹{(last.counter || D.COUNTER.price).toFixed(2)}</span></div>
            {last.status === "countered" && <Button variant="violet" size="lg" block icon="check" onClick={accept}>Accept ₹{D.COUNTER.price.toFixed(2)} · pay {fmt.inr(D.AWARD.token)} token</Button>}
          </Card>)}
        <Card className="stack snug"><div className="card-head"><span className="card-title">Chat with the seller</span><span className="t-caption subtle">answered by an agent</span></div>
          {h.chat.length ? <S.Chat chat={h.chat} typing={last && last.status === "placed"} /> : <span className="t-footnote muted">Ask about dates, dispatch or a lower price.</span>}
          {!readOnly && !h.award && <form className="row" style={{ gap: 8 }} onSubmit={e => { e.preventDefault(); setMsg(""); }}><input className="input grow" placeholder="Message Rakesh Traders" value={msg} onChange={e => setMsg(e.target.value)} aria-label="Message the seller" /><IconButton icon="send" label="Send" type="submit" /></form>}
        </Card>
      </div>
    </div>;
  }
  function Listing({ me }) { return <div className="esw"><Screen me={me} title={`Lot ${D.JOURNEY.listing.id}`} sub="Munchly Masala Chips 150 g · Rakesh Traders, Nagpur" back="Marketplace"><div className="stack" style={{ gap: 16 }}><EsBar /><ListingView me={me} /></div></Screen></div>; }
  function MyBids({ me }) {
    const s = useStore(); const h = s.hero; const { go } = useRoute();
    return <div className="esw"><Screen me={me} title="My bids" sub={`${D.BUYER.name} · ${D.BUYER.city}`}><div className="stack" style={{ gap: 16 }}><EsBar />
      {h.bids.length ? <div className="list" data-x="bids">{h.bids.map(b => <button type="button" key={b.id} className="list-row" onClick={() => go("listing")} style={{ gridTemplateColumns: "48px minmax(0,1fr) auto", textAlign: "left", width: "100%" }}><Product name="pack-chips" size={44} /><span className="stack tight" style={{ gap: 0 }}><b className="t-subhead">{D.JOURNEY.listing.id} · Masala Chips 150 g · {ES.units} units</b><span className="t-caption subtle">bid ₹{b.price.toFixed(2)} · {b.at}{b.counter ? ` · counter ₹${b.counter.toFixed(2)}` : ""}</span></span><Badge size="sm" tone={b.status === "accepted" ? "green" : "violet"}>{b.status === "accepted" ? "won" : b.status}</Badge></button>)}</div> : <Card><Empty img="marketplace-bag" title="No bids yet" body="Bids you place show here with the seller's reply." /></Card>}
    </div></Screen></div>;
  }

  /* ======================= Meera · Feeding India ======================= */
  function Pickups({ me }) {
    const s = useStore(); const d = s.mango.donation; const app = useApp(); const [later, setLater] = useState(false); const { toast } = useNotice(); const n = D.MANGO_FB; const DN = D.JOURNEY.donation;
    const bb = fmt.date(D.BATCHES[1].bestBefore);
    return <Screen me={me} title="Pickups" sub="Feeding India · Hyderabad">
      {!d ? <Card style={{ maxWidth: 640 }}><Empty img="donation-crate" title="No pickup requests" body="Brands' donation agents send surplus food here when it fits your intake rules: 15+ days left, 50+ units." /></Card> :
      <Columns sideWidth={340}
        main={<>
          <div className="bezel"><div className="card raised stack" style={{ padding: 22, gap: 16 }}>
            <div className="row tight"><Mark size={28} /><span className="t-footnote subtle strong">Donation agent · Munchly Foods · {DN.asked}</span></div>
            <div className="row" style={{ gap: 16 }}><Product name="pack-mango" size={app.bp === "phone" ? 80 : 104} float /><div className="stack tight" style={{ gap: 4 }}><div className="t-title2">{n} packs of Mango Drink</div><span className="row tight wrap"><Badge icon="calendar">22 days left</Badge><Badge icon="map-pin">{DN.from}</Badge><Badge tone="green" icon="clipboard-check">FSSAI checklist</Badge></span></div></div>
            <p className="t-body" style={{ margin: 0 }}>{n} packs of Mango Drink, 22 days left, with the FSSAI checklist. Pickup {DN.day} {DN.hour} from {DN.from}?</p>
            {d === "booked" ? <div className="row wrap" style={{ gap: 10 }}><Button variant="primary" size="lg" icon="check" onClick={() => Flow.act("confirmPickup")}>Confirm {DN.day} {DN.time}</Button><Button variant="secondary" size="lg" onClick={() => setLater(true)}>Suggest another time</Button></div>
              : <div className="row top" style={{ gap: 10, justifyContent: "flex-end" }}><div className="t-subhead" style={{ padding: "9px 12px", borderRadius: 16, borderTopRightRadius: 6, background: "var(--primary)", color: "var(--primary-fg)", maxWidth: "85%" }}>{DN.reply}<div className="t-caption" style={{ opacity: 0.9 }}>Meera · {DN.confirmed}</div></div><Avatar person={D.PEOPLE.meera} size="sm" /></div>}
          </div></div>
          {d !== "booked" && <Card className="stack snug"><div className="card-head"><span className="card-title">Pickup</span><Badge tone="green" icon={d === "collected" ? "check" : "calendar"}>{d === "collected" ? "collected" : `${DN.date} · ${DN.time}`}</Badge></div>
            <K.VTracker items={[{ id: "req", title: "Requested by the donation agent", time: DN.asked }, { id: "conf", title: "Confirmed by Meera", time: DN.confirmed }, { id: "col", title: `Collected from ${DN.from}`, time: d === "collected" ? DN.collected : `${DN.date.split(" ")[0]} ${DN.time}` }, { id: "serve", title: `Served at ${DN.spot}`, time: "this week" }]} done={d === "collected" ? 3 : 2} current={d === "collected" ? 3 : 2} />
            {d === "confirmed" && <Button variant="primary" size="lg" icon="package-check" onClick={() => { Flow.act("collect"); toast({ text: `Receipt issued · ${n} drinks`, tone: "ok" }); }}>Mark collected</Button>}
            {d === "collected" && <div className="row" style={{ gap: 12, padding: "12px 14px", borderRadius: 14, background: "var(--primary-soft)" }}><Icon name="receipt" size={20} /><span className="grow"><b>In-app receipt issued</b><div className="t-footnote muted">{n} drinks served · shared with Munchly for its BRSR table</div></span></div>}
          </Card>}
        </>}
        side={<><SectionTitle>FSSAI surplus-food checklist</SectionTitle><Card className="paper stack tight" style={{ padding: 18 }}>{["Sealed, undamaged packs", `Best before ${bb}, 22 days left`, "Ambient storage, away from sunlight", "Batch MF-2410-118 on every carton", "Donor: Munchly Foods via Lakshmi Agencies"].map(t => <div key={t} className="row top" style={{ gap: 8 }}><Icon name="square-check" size={17} style={{ color: "#167a52", marginTop: 1 }} /><span className="t-subhead">{t}</span></div>)}</Card>
          <List head="Your intake rules"><ListRow title="Days left" value="15 or more" /><ListRow title="Minimum lot" value="50 units" /><ListRow title="Logistics" value={D.SETUP.partners[0].pickup} /></List></>} />}
      <Sheet open={later} onClose={() => setLater(false)} title="Suggest another time" detent="medium" footer={<Button variant="primary" block onClick={() => { setLater(false); toast({ text: "Sent · the agent will confirm with Lakshmi Agencies" }); }}>Send</Button>}><div className="stack snug">{DN.slots.map(t => <label key={t} className="list-row" style={{ gridTemplateColumns: "auto 1fr", cursor: "pointer" }}><input type="radio" name="slot" defaultChecked={t === DN.slots[0]} /> {t}</label>)}</div></Sheet>
    </Screen>;
  }

  Object.assign(window.SC3_SCREENS, { distOf, kOf, DistHome, CameraScreen, VanRoute, DistOrders, OfferCard, RetailHome, OfferDetail, RetailOrders, Market, Listing, ListingView, MyBids, Pickups, EsBar, offerMath, cartons, PermissionCard });
})();
