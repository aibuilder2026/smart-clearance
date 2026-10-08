// SC-80's camera mockup: Rakesh's label photo step (design3/screens/trade.jsx CameraInner) with two clear ways to send
// the photo: take one, or upload one already taken. Loaded after screens/trade.js, it replaces SC3_SCREENS.CameraScreen
// in the live app (SC-68's ?state=upload-photo moment, Rakesh at the camera). ?opt=a|b|c picks the option, ?moment= the
// moment, ?shot=1 holds it still. The laptop's camera is simulated with the sample label photo. Fictional throughout.
//   A · two ways under the frame (recommended): the frame stays as the guide, with Take a photo and Upload a photo
//       under it; the primary follows the device. ?moment=choose|camera|drop|picked
//   B · choose first: what Vision needs and an example, then two choices; the photo is checked before it goes.
//       ?moment=choose|picked
//   C · the real viewfinder: the camera opens in the frame; Upload sits beside the shutter. ?moment=viewfinder|blocked|picked
(function () {
  const { useState, useEffect, useRef } = React;
  const { motion, AnimatePresence, useReducedMotion } = Motion;
  const K = window.SC3, S = window.SC3_SCREENS, Flow = window.SC3_FLOW;
  const { cx, Icon, Button, Card, List, ListRow, Aura, useApp } = K;
  const { useStore, useRoute, Screen, distOf } = S;
  const Q = new URLSearchParams(location.search);
  const OPT = ["a", "b", "c"].includes(Q.get("opt")) ? Q.get("opt") : "a";
  const MOMENTS = { a: ["choose", "camera", "drop", "picked"], b: ["choose", "picked"], c: ["viewfinder", "blocked", "picked"] };
  const MOMENT = MOMENTS[OPT].includes(Q.get("moment")) ? Q.get("moment") : MOMENTS[OPT][0];
  const SHOT = Q.get("shot") === "1";
  const SAMPLE = window.SC80_SAMPLE || "../sample/label-photo.webp";
  // what backend-api takes (steps.photo_upload); naming the types makes iOS hand over a HEIC photo as a JPEG
  const ACCEPT = "image/jpeg,image/png,image/webp";
  const RULE = "JPEG, PNG or WebP, under 8 MB";
  const EASE = [0.22, 1, 0.36, 1];

  // what every option shares: the photo picked or taken, the camera, the send, and what Vision says after
  function useCamera() {
    const s = useStore(); const h = s.hero; const live = S.useLive(); const reduce = useReducedMotion(); const { bp } = useApp();
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    const phoneCam = useRef(null), files = useRef(null);
    const start = MOMENT === "picked" ? { url: SAMPLE, how: "upload", name: "label-MF-2409-117.jpg" } : null;
    const [shot, setShot] = useState(start);
    const [camOn, setCamOn] = useState(MOMENT === "camera" || MOMENT === "viewfinder");
    const [blocked, setBlocked] = useState(MOMENT === "blocked");
    const [over, setOver] = useState(MOMENT === "drop");
    const [flash, setFlash] = useState(false); const [sending, setSending] = useState(false);
    // a photo in hand is shown whole, in its own shape, so it can be checked before it goes
    const [ratio, setRatio] = useState(null);
    // the moment starts before a photo, so the app's part-way upload from ?state=upload-photo is let go
    useEffect(() => { if (live && live.uploads.photo != null) live.cancelUpload("photo"); }, []);
    const uploading = !!live && live.uploads.photo != null;
    const sent = h.photo.status === "reading" || h.photo.status === "verified";
    const use = (f, how) => { if (f) { setRatio(null); setShot({ url: URL.createObjectURL(f), how, name: f.name }); } setOver(false); setCamOn(false); };
    const picked = how => e => { const f = e.target.files && e.target.files[0]; use(f, how); e.target.value = ""; };
    // a phone opens its own camera app; a laptop opens its camera in the frame (simulated here)
    const take = () => { if (coarse && phoneCam.current) { phoneCam.current.click(); return; } setBlocked(false); setCamOn(true); };
    const shutter = () => { setFlash(true); setTimeout(() => { setFlash(false); setCamOn(false); setShot({ url: SAMPLE, how: "camera" }); }, reduce ? 0 : 180); };
    const upload = () => files.current && files.current.click();
    const drop = { onDragOver: e => { e.preventDefault(); setOver(true); }, onDragLeave: () => setOver(false), onDrop: e => { e.preventDefault(); use(e.dataTransfer.files && e.dataTransfer.files[0], "upload"); } };
    const send = () => { if (live) { live.sendPhoto(() => Flow.act("sendPhoto")); return; } setSending(true); setTimeout(() => { setSending(false); Flow.act("sendPhoto"); }, 700); };
    const inputs = <>
      <input ref={phoneCam} type="file" accept={ACCEPT} capture="environment" onChange={picked("camera")} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <input ref={files} type="file" accept={ACCEPT} onChange={picked("upload")} className="sr-only" tabIndex={-1} aria-hidden="true" />
    </>;
    const frame = (extra) => ({ className: cx("cam", extra, over && "s80-over", camOn && !shot && !coarse && bp !== "phone" && "s80-landscape"), style: shot && ratio ? { aspectRatio: String(ratio) } : undefined });
    return { s, h, live, reduce, bp, coarse, shot, setShot, ratio, setRatio, frame, camOn, setCamOn, blocked, setBlocked, over, flash, sending, uploading, sent, take, shutter, upload, drop, send, inputs };
  }

  // the photo in the frame, faded in; the scan line while Vision reads it (three sweeps, then it rests)
  function Feed({ c, url, alt, whole }) {
    return <motion.img key={url} className={cx("cam-feed", whole && "s80-whole")} src={url} alt={alt} onLoad={whole ? e => c.setRatio(Math.max(0.75, Math.min(1.5, e.target.naturalWidth / e.target.naturalHeight))) : undefined} initial={c.reduce ? false : { opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.24, ease: EASE }} />;
  }
  function Overlays({ c }) {
    return <>
      <AnimatePresence>{c.flash && <motion.div key="f" className="cam-flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} />}</AnimatePresence>
      {c.sent && <div className="cam-hint" style={{ background: "var(--green-700)" }}><Icon name={c.h.photo.status === "verified" ? "check" : "loader"} size={14} className={c.h.photo.status === "verified" ? "" : "spin"} /> {c.h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"}</div>}
      {c.h.photo.status === "reading" && !c.reduce && <motion.div aria-hidden="true" className="cam-scan" animate={{ top: ["20%", "76%", "20%"] }} transition={{ duration: 1.6, repeat: 2, ease: "easeInOut" }} />}
    </>;
  }
  const Corners = () => <div className="cam-frame" aria-hidden="true"><i /><i /><i /><i /></div>;
  // a photo dragged over the frame: drop it to use it
  const DropCue = ({ on, reduce }) => <AnimatePresence>{on && <motion.div key="d" className="s80-dropcue" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}><span className="s80-dropcue-in"><Icon name="image" size={22} /><b>Drop the photo to use it</b></span></motion.div>}</AnimatePresence>;
  // after Send: the photo goes (Send fills), then Vision reads it, as designed (SC-73)
  function After({ c, me }) {
    const { go } = useRoute(); const h = c.h;
    if (c.sent) return <Card className="stack snug">
      <div className="row" style={{ gap: 12 }}><Aura on={h.photo.status === "reading"} className="icontile" style={{ borderRadius: 12, width: 40, height: 40 }}><Icon name={h.photo.status === "verified" ? "badge-check" : "scan-line"} size={19} /></Aura><div className="grow"><b>{h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"}</b><div className="t-footnote muted">{h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."}</div></div></div>
      {h.photo.status === "verified" && <List>{[["Batch", "MF-2409-117"], ["Best before", "18 Nov 2026"], ["MRP", "₹30.00"]].map(([k, v]) => <ListRow key={k} title={k} value={v} />)}</List>}
      <Button variant="secondary" block onClick={() => go("home")}>Back to today</Button>
    </Card>;
    if (c.uploading) return <S.Live.SendFill p={c.live.uploads.photo} onCancel={() => c.live.cancelUpload("photo")} />;
    return null;
  }
  // a photo in hand: take it again or choose another, or send it
  function Review({ c, retake }) {
    const again = c.shot.how === "camera" ? ["rotate-ccw", "Retake", retake || c.take] : ["image", "Choose another", c.upload];
    return <motion.div key="review" className="row s80-review" initial={c.reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: EASE }}>
      <Button variant="secondary" size="lg" icon={again[0]} onClick={() => { c.setShot(null); again[2](); }}>{again[1]}</Button>
      <Button variant="primary" size="lg" block icon="send" loading={c.sending} onClick={c.send}>Send photo</Button>
    </motion.div>;
  }

  /* ---------- A · two ways under the frame ---------- */
  function OptionA({ me }) {
    const c = useCamera(); const desk = !c.coarse && c.bp !== "phone";
    const busy = c.sent || c.uploading;
    return <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div {...c.frame()} {...(busy ? {} : c.drop)}>
        {c.shot ? <Feed c={c} url={c.shot.url} alt="Your photo of the carton label" whole /> : c.camOn ? (desk ? <Feed c={c} url={SAMPLE} alt="" /> : <S.LabelShot cover />) : <S.LabelShot cover dim={!busy} />}
        {!c.shot && !busy && <><Corners /><div className="cam-hint">{c.camOn ? "Fit one carton label in the frame" : "Like this: one carton label, close up"}</div></>}
        {!c.shot && !c.camOn && !busy && <span className="s80-tag">Example</span>}
        {c.camOn && !c.shot && <span className="s80-tag s80-live"><i aria-hidden="true" />Laptop camera</span>}
        {c.shot && !busy && <span className="s80-tag">{c.shot.how === "camera" ? "Your photo" : c.shot.name || "Your photo"}</span>}
        <DropCue on={c.over && !busy} reduce={c.reduce} />
        <Overlays c={c} />
      </div>
      {busy ? <After c={c} me={me} /> : <AnimatePresence mode="wait" initial={false}>
        {c.shot ? <Review key="r" c={c} /> : c.camOn ? <motion.div key="cam" className="cam-bar" initial={c.reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
          <Button variant="ghost" onClick={() => c.setCamOn(false)}>Cancel</Button>
          <button type="button" className="shutter" aria-label="Take the photo" onClick={c.shutter}><span /></button>
          <Button variant="ghost" icon="image" onClick={c.upload}>Upload</Button>
        </motion.div> : <motion.div key="two" className="s80-two" initial={c.reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
          <Button variant={desk ? "secondary" : "primary"} size="lg" icon="camera" onClick={c.take}>Take a photo</Button>
          <Button variant={desk ? "primary" : "secondary"} size="lg" icon="upload" onClick={c.upload}>Upload a photo</Button>
        </motion.div>}
      </AnimatePresence>}
      {c.inputs}
      {!busy && <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>{c.shot ? "Check that you can read the batch, both dates and the MRP." : c.camOn ? "Hold the label flat to the camera, close enough to read." : desk ? `${RULE}. Or drop a photo on the frame.` : `Take a photo opens your camera. ${RULE}.`}</p>}
    </div>;
  }

  /* ---------- B · choose first ---------- */
  function OptionB({ me }) {
    const c = useCamera(); const desk = !c.coarse && c.bp !== "phone"; const busy = c.sent || c.uploading;
    if (c.shot || busy) return <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div {...c.frame("s80-cam-review")}><Feed c={c} url={c.shot ? c.shot.url : SAMPLE} alt="Your photo of the carton label" whole /><Overlays c={c} /></div>
      {busy ? <After c={c} me={me} /> : <>
        <Card className="stack snug s80-check">
          <b>Before you send it, check you can read</b>
          <ul className="s80-ticks">{["The batch number", "The MFG and best-before dates", "The MRP"].map(t => <li key={t}><Icon name="circle-check" size={17} /><span>{t}</span></li>)}</ul>
        </Card>
        <Review c={c} />
      </>}
      {c.inputs}
    </div>;
    if (c.camOn) return <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div {...c.frame()}>{desk ? <Feed c={c} url={SAMPLE} alt="" /> : <S.LabelShot cover />}<Corners /><div className="cam-hint">Fit one carton label in the frame</div><span className="s80-tag s80-live"><i aria-hidden="true" />Laptop camera</span><Overlays c={c} /></div>
      <div className="cam-bar"><Button variant="ghost" onClick={() => c.setCamOn(false)}>Back</Button><button type="button" className="shutter" aria-label="Take the photo" onClick={c.shutter}><span /></button><span style={{ width: 64 }} /></div>
      {c.inputs}
    </div>;
    return <div className="stack" style={{ gap: 16, maxWidth: 640, margin: "0 auto", width: "100%" }}>
      <Card className="s80-ask">
        <div className="s80-thumb"><S.LabelShot /></div>
        <div className="stack tight" style={{ gap: 6, minWidth: 0 }}>
          <b className="t-headline">One photo of a carton label</b>
          <span className="t-subhead muted">Vision reads the batch, both dates and the MRP, and checks them against your records before anything is priced. Like this one.</span>
        </div>
      </Card>
      <div className="s80-choices" role="group" aria-label="How to send the photo">
        <button type="button" className="s80-choice" onClick={c.take}><span className="icontile"><Icon name="camera" size={20} stroke={2} /></span><span className="s80-choice-t"><b>Take a photo</b><span>{desk ? "With this laptop's camera" : "With your camera, at the shelf"}</span></span><Icon name="chevron-right" size={18} className="s80-chev" /></button>
        <button type="button" className={cx("s80-choice", c.over && "over")} onClick={c.upload} {...c.drop}><span className="icontile"><Icon name="upload" size={20} stroke={2} /></span><span className="s80-choice-t"><b>Upload a photo</b><span>{desk ? "One you already took. Or drop it here" : "One you already took, from your gallery"}</span></span><Icon name="chevron-right" size={18} className="s80-chev" /></button>
      </div>
      <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>{RULE}.</p>
      {c.inputs}
    </div>;
  }

  /* ---------- C · the real viewfinder ---------- */
  function OptionC({ me }) {
    const c = useCamera(); const busy = c.sent || c.uploading; const desk = !c.coarse && c.bp !== "phone";
    return <div className="stack" style={{ gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div {...c.frame()} {...(busy ? {} : c.drop)}>
        {c.shot ? <Feed c={c} url={c.shot.url} alt="Your photo of the carton label" whole /> : c.blocked ? null : desk ? <Feed c={c} url={SAMPLE} alt="" /> : <S.LabelShot cover />}
        {!c.shot && !c.blocked && !busy && <><Corners /><div className="cam-hint">Fit one carton label in the frame</div><span className="s80-tag s80-live"><i aria-hidden="true" />{desk ? "Laptop camera" : "Camera"}</span></>}
        {c.blocked && !c.shot && <div className="s80-blocked">
          <span className="s80-blocked-ic"><Icon name="lock" size={22} /></span>
          <b>The camera is blocked for this page</b>
          <span>Allow the camera in the browser's site settings, or upload a photo you already took.</span>
          <span className="row tight wrap" style={{ justifyContent: "center" }}><Button variant="primary" icon="upload" onClick={c.upload}>Upload a photo</Button><Button variant="secondary" className="s80-on-dark" onClick={() => c.setBlocked(false)}>Try the camera again</Button></span>
        </div>}
        {c.shot && !busy && <span className="s80-tag">{c.shot.how === "camera" ? "Your photo" : c.shot.name || "Your photo"}</span>}
        <DropCue on={c.over && !busy} reduce={c.reduce} />
        <Overlays c={c} />
      </div>
      {busy ? <After c={c} me={me} /> : c.shot ? <Review c={c} retake={() => {}} /> : !c.blocked && <div className="cam-bar s80-bar">
        <button type="button" className="s80-side" onClick={c.upload}><span className="s80-side-ic"><Icon name="image" size={22} /></span><span>Upload</span></button>
        <button type="button" className="shutter" aria-label="Take the photo" onClick={c.shutter}><span /></button>
        <span className="s80-side" aria-hidden="true" />
      </div>}
      {c.inputs}
      {!busy && !c.blocked && <p className="t-caption subtle" style={{ textAlign: "center", margin: 0 }}>{c.shot ? "Check that you can read the batch, both dates and the MRP." : desk ? `Or upload a photo you already took, or drop one on the frame. ${RULE}.` : `${RULE}.`}</p>}
    </div>;
  }

  function CameraInner({ me }) {
    const Opt = OPT === "b" ? OptionB : OPT === "c" ? OptionC : OptionA;
    return <Screen me={me} title="Label photo" sub="Batch MF-2409-117 · shelf B4" back="Today"><Opt me={me} /></Screen>;
  }
  const Base = S.CameraScreen;
  function CameraScreen(props) {
    if (distOf(props.me).id !== "rakesh") return <Base {...props} />;
    return <CameraInner me={props.me} />;
  }
  Object.assign(window.SC3_SCREENS, { CameraScreen });
})();
