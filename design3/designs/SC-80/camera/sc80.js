(function() {
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
  const ACCEPT = "image/jpeg,image/png,image/webp";
  const RULE = "JPEG, PNG or WebP, under 8 MB";
  const EASE = [0.22, 1, 0.36, 1];
  function useCamera() {
    const s = useStore();
    const h = s.hero;
    const live = S.useLive();
    const reduce = useReducedMotion();
    const { bp } = useApp();
    const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
    const phoneCam = useRef(null), files = useRef(null);
    const start = MOMENT === "picked" ? { url: SAMPLE, how: "upload", name: "label-MF-2409-117.jpg" } : null;
    const [shot, setShot] = useState(start);
    const [camOn, setCamOn] = useState(MOMENT === "camera" || MOMENT === "viewfinder");
    const [blocked, setBlocked] = useState(MOMENT === "blocked");
    const [over, setOver] = useState(MOMENT === "drop");
    const [flash, setFlash] = useState(false);
    const [sending, setSending] = useState(false);
    const [ratio, setRatio] = useState(null);
    useEffect(() => {
      if (live && live.uploads.photo != null) live.cancelUpload("photo");
    }, []);
    const uploading = !!live && live.uploads.photo != null;
    const sent = h.photo.status === "reading" || h.photo.status === "verified";
    const use = (f, how) => {
      if (f) {
        setRatio(null);
        setShot({ url: URL.createObjectURL(f), how, name: f.name });
      }
      setOver(false);
      setCamOn(false);
    };
    const picked = (how) => (e) => {
      const f = e.target.files && e.target.files[0];
      use(f, how);
      e.target.value = "";
    };
    const take = () => {
      if (coarse && phoneCam.current) {
        phoneCam.current.click();
        return;
      }
      setBlocked(false);
      setCamOn(true);
    };
    const shutter = () => {
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setCamOn(false);
        setShot({ url: SAMPLE, how: "camera" });
      }, reduce ? 0 : 180);
    };
    const upload = () => files.current && files.current.click();
    const drop = { onDragOver: (e) => {
      e.preventDefault();
      setOver(true);
    }, onDragLeave: () => setOver(false), onDrop: (e) => {
      e.preventDefault();
      use(e.dataTransfer.files && e.dataTransfer.files[0], "upload");
    } };
    const send = () => {
      if (live) {
        live.sendPhoto(() => Flow.act("sendPhoto"));
        return;
      }
      setSending(true);
      setTimeout(() => {
        setSending(false);
        Flow.act("sendPhoto");
      }, 700);
    };
    const inputs = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("input", { ref: phoneCam, type: "file", accept: ACCEPT, capture: "environment", onChange: picked("camera"), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("input", { ref: files, type: "file", accept: ACCEPT, onChange: picked("upload"), className: "sr-only", tabIndex: -1, "aria-hidden": "true" }));
    const frame = (extra) => ({ className: cx("cam", extra, over && "s80-over", camOn && !shot && !coarse && bp !== "phone" && "s80-landscape"), style: shot && ratio ? { aspectRatio: String(ratio) } : void 0 });
    return { s, h, live, reduce, bp, coarse, shot, setShot, ratio, setRatio, frame, camOn, setCamOn, blocked, setBlocked, over, flash, sending, uploading, sent, take, shutter, upload, drop, send, inputs };
  }
  function Feed({ c, url, alt, whole }) {
    return /* @__PURE__ */ React.createElement(motion.img, { key: url, className: cx("cam-feed", whole && "s80-whole"), src: url, alt, onLoad: whole ? (e) => c.setRatio(Math.max(0.75, Math.min(1.5, e.target.naturalWidth / e.target.naturalHeight))) : void 0, initial: c.reduce ? false : { opacity: 0, scale: 1.02 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.24, ease: EASE } });
  }
  function Overlays({ c }) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(AnimatePresence, null, c.flash && /* @__PURE__ */ React.createElement(motion.div, { key: "f", className: "cam-flash", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } })), c.sent && /* @__PURE__ */ React.createElement("div", { className: "cam-hint", style: { background: "var(--green-700)" } }, /* @__PURE__ */ React.createElement(Icon, { name: c.h.photo.status === "verified" ? "check" : "loader", size: 14, className: c.h.photo.status === "verified" ? "" : "spin" }), " ", c.h.photo.status === "verified" ? "Verified · matches your records" : "Sent · Vision is reading the label"), c.h.photo.status === "reading" && !c.reduce && /* @__PURE__ */ React.createElement(motion.div, { "aria-hidden": "true", className: "cam-scan", animate: { top: ["20%", "76%", "20%"] }, transition: { duration: 1.6, repeat: 2, ease: "easeInOut" } }));
  }
  const Corners = () => /* @__PURE__ */ React.createElement("div", { className: "cam-frame", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null));
  const DropCue = ({ on, reduce }) => /* @__PURE__ */ React.createElement(AnimatePresence, null, on && /* @__PURE__ */ React.createElement(motion.div, { key: "d", className: "s80-dropcue", initial: reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement("span", { className: "s80-dropcue-in" }, /* @__PURE__ */ React.createElement(Icon, { name: "image", size: 22 }), /* @__PURE__ */ React.createElement("b", null, "Drop the photo to use it"))));
  function After({ c, me }) {
    const { go } = useRoute();
    const h = c.h;
    if (c.sent) return /* @__PURE__ */ React.createElement(Card, { className: "stack snug" }, /* @__PURE__ */ React.createElement("div", { className: "row", style: { gap: 12 } }, /* @__PURE__ */ React.createElement(Aura, { on: h.photo.status === "reading", className: "icontile", style: { borderRadius: 12, width: 40, height: 40 } }, /* @__PURE__ */ React.createElement(Icon, { name: h.photo.status === "verified" ? "badge-check" : "scan-line", size: 19 })), /* @__PURE__ */ React.createElement("div", { className: "grow" }, /* @__PURE__ */ React.createElement("b", null, h.photo.status === "verified" ? "Done. Dhanyavaad, Rakesh bhai." : "Reading batch, dates and MRP"), /* @__PURE__ */ React.createElement("div", { className: "t-footnote muted" }, h.photo.status === "verified" ? "The plan for this batch will reach Priya in a few minutes." : "This takes a few seconds."))), h.photo.status === "verified" && /* @__PURE__ */ React.createElement(List, null, [["Batch", "MF-2409-117"], ["Best before", "18 Nov 2026"], ["MRP", "₹30.00"]].map(([k, v]) => /* @__PURE__ */ React.createElement(ListRow, { key: k, title: k, value: v }))), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", block: true, onClick: () => go("home") }, "Back to today"));
    if (c.uploading) return /* @__PURE__ */ React.createElement(S.Live.SendFill, { p: c.live.uploads.photo, onCancel: () => c.live.cancelUpload("photo") });
    return null;
  }
  function Review({ c, retake }) {
    const again = c.shot.how === "camera" ? ["rotate-ccw", "Retake", retake || c.take] : ["image", "Choose another", c.upload];
    return /* @__PURE__ */ React.createElement(motion.div, { key: "review", className: "row s80-review", initial: c.reduce ? false : { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.16, ease: EASE } }, /* @__PURE__ */ React.createElement(Button, { variant: "secondary", size: "lg", icon: again[0], onClick: () => {
      c.setShot(null);
      again[2]();
    } }, again[1]), /* @__PURE__ */ React.createElement(Button, { variant: "primary", size: "lg", block: true, icon: "send", loading: c.sending, onClick: c.send }, "Send photo"));
  }
  function OptionA({ me }) {
    const c = useCamera();
    const desk = !c.coarse && c.bp !== "phone";
    const busy = c.sent || c.uploading;
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { ...c.frame(), ...busy ? {} : c.drop }, c.shot ? /* @__PURE__ */ React.createElement(Feed, { c, url: c.shot.url, alt: "Your photo of the carton label", whole: true }) : c.camOn ? desk ? /* @__PURE__ */ React.createElement(Feed, { c, url: SAMPLE, alt: "" }) : /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true }) : /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true, dim: !busy }), !c.shot && !busy && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Corners, null), /* @__PURE__ */ React.createElement("div", { className: "cam-hint" }, c.camOn ? "Fit one carton label in the frame" : "Like this: one carton label, close up")), !c.shot && !c.camOn && !busy && /* @__PURE__ */ React.createElement("span", { className: "s80-tag" }, "Example"), c.camOn && !c.shot && /* @__PURE__ */ React.createElement("span", { className: "s80-tag s80-live" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Laptop camera"), c.shot && !busy && /* @__PURE__ */ React.createElement("span", { className: "s80-tag" }, c.shot.how === "camera" ? "Your photo" : c.shot.name || "Your photo"), /* @__PURE__ */ React.createElement(DropCue, { on: c.over && !busy, reduce: c.reduce }), /* @__PURE__ */ React.createElement(Overlays, { c })), busy ? /* @__PURE__ */ React.createElement(After, { c, me }) : /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait", initial: false }, c.shot ? /* @__PURE__ */ React.createElement(Review, { key: "r", c }) : c.camOn ? /* @__PURE__ */ React.createElement(motion.div, { key: "cam", className: "cam-bar", initial: c.reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: () => c.setCamOn(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "shutter", "aria-label": "Take the photo", onClick: c.shutter }, /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", icon: "image", onClick: c.upload }, "Upload")) : /* @__PURE__ */ React.createElement(motion.div, { key: "two", className: "s80-two", initial: c.reduce ? false : { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }, /* @__PURE__ */ React.createElement(Button, { variant: desk ? "secondary" : "primary", size: "lg", icon: "camera", onClick: c.take }, "Take a photo"), /* @__PURE__ */ React.createElement(Button, { variant: desk ? "primary" : "secondary", size: "lg", icon: "upload", onClick: c.upload }, "Upload a photo"))), c.inputs, !busy && /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, c.shot ? "Check that you can read the batch, both dates and the MRP." : c.camOn ? "Hold the label flat to the camera, close enough to read." : desk ? `${RULE}. Or drop a photo on the frame.` : `Take a photo opens your camera. ${RULE}.`));
  }
  function OptionB({ me }) {
    const c = useCamera();
    const desk = !c.coarse && c.bp !== "phone";
    const busy = c.sent || c.uploading;
    if (c.shot || busy) return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { ...c.frame("s80-cam-review") }, /* @__PURE__ */ React.createElement(Feed, { c, url: c.shot ? c.shot.url : SAMPLE, alt: "Your photo of the carton label", whole: true }), /* @__PURE__ */ React.createElement(Overlays, { c })), busy ? /* @__PURE__ */ React.createElement(After, { c, me }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Card, { className: "stack snug s80-check" }, /* @__PURE__ */ React.createElement("b", null, "Before you send it, check you can read"), /* @__PURE__ */ React.createElement("ul", { className: "s80-ticks" }, ["The batch number", "The MFG and best-before dates", "The MRP"].map((t) => /* @__PURE__ */ React.createElement("li", { key: t }, /* @__PURE__ */ React.createElement(Icon, { name: "circle-check", size: 17 }), /* @__PURE__ */ React.createElement("span", null, t))))), /* @__PURE__ */ React.createElement(Review, { c })), c.inputs);
    if (c.camOn) return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { ...c.frame() }, desk ? /* @__PURE__ */ React.createElement(Feed, { c, url: SAMPLE, alt: "" }) : /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true }), /* @__PURE__ */ React.createElement(Corners, null), /* @__PURE__ */ React.createElement("div", { className: "cam-hint" }, "Fit one carton label in the frame"), /* @__PURE__ */ React.createElement("span", { className: "s80-tag s80-live" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), "Laptop camera"), /* @__PURE__ */ React.createElement(Overlays, { c })), /* @__PURE__ */ React.createElement("div", { className: "cam-bar" }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: () => c.setCamOn(false) }, "Back"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "shutter", "aria-label": "Take the photo", onClick: c.shutter }, /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement("span", { style: { width: 64 } })), c.inputs);
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 640, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement(Card, { className: "s80-ask" }, /* @__PURE__ */ React.createElement("div", { className: "s80-thumb" }, /* @__PURE__ */ React.createElement(S.LabelShot, null)), /* @__PURE__ */ React.createElement("div", { className: "stack tight", style: { gap: 6, minWidth: 0 } }, /* @__PURE__ */ React.createElement("b", { className: "t-headline" }, "One photo of a carton label"), /* @__PURE__ */ React.createElement("span", { className: "t-subhead muted" }, "Vision reads the batch, both dates and the MRP, and checks them against your records before anything is priced. Like this one."))), /* @__PURE__ */ React.createElement("div", { className: "s80-choices", role: "group", "aria-label": "How to send the photo" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "s80-choice", onClick: c.take }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "camera", size: 20, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "s80-choice-t" }, /* @__PURE__ */ React.createElement("b", null, "Take a photo"), /* @__PURE__ */ React.createElement("span", null, desk ? "With this laptop's camera" : "With your camera, at the shelf")), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "s80-chev" })), /* @__PURE__ */ React.createElement("button", { type: "button", className: cx("s80-choice", c.over && "over"), onClick: c.upload, ...c.drop }, /* @__PURE__ */ React.createElement("span", { className: "icontile" }, /* @__PURE__ */ React.createElement(Icon, { name: "upload", size: 20, stroke: 2 })), /* @__PURE__ */ React.createElement("span", { className: "s80-choice-t" }, /* @__PURE__ */ React.createElement("b", null, "Upload a photo"), /* @__PURE__ */ React.createElement("span", null, desk ? "One you already took. Or drop it here" : "One you already took, from your gallery")), /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 18, className: "s80-chev" }))), /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, RULE, "."), c.inputs);
  }
  function OptionC({ me }) {
    const c = useCamera();
    const busy = c.sent || c.uploading;
    const desk = !c.coarse && c.bp !== "phone";
    return /* @__PURE__ */ React.createElement("div", { className: "stack", style: { gap: 16, maxWidth: 560, margin: "0 auto", width: "100%" } }, /* @__PURE__ */ React.createElement("div", { ...c.frame(), ...busy ? {} : c.drop }, c.shot ? /* @__PURE__ */ React.createElement(Feed, { c, url: c.shot.url, alt: "Your photo of the carton label", whole: true }) : c.blocked ? null : desk ? /* @__PURE__ */ React.createElement(Feed, { c, url: SAMPLE, alt: "" }) : /* @__PURE__ */ React.createElement(S.LabelShot, { cover: true }), !c.shot && !c.blocked && !busy && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Corners, null), /* @__PURE__ */ React.createElement("div", { className: "cam-hint" }, "Fit one carton label in the frame"), /* @__PURE__ */ React.createElement("span", { className: "s80-tag s80-live" }, /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }), desk ? "Laptop camera" : "Camera")), c.blocked && !c.shot && /* @__PURE__ */ React.createElement("div", { className: "s80-blocked" }, /* @__PURE__ */ React.createElement("span", { className: "s80-blocked-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "lock", size: 22 })), /* @__PURE__ */ React.createElement("b", null, "The camera is blocked for this page"), /* @__PURE__ */ React.createElement("span", null, "Allow the camera in the browser's site settings, or upload a photo you already took."), /* @__PURE__ */ React.createElement("span", { className: "row tight wrap", style: { justifyContent: "center" } }, /* @__PURE__ */ React.createElement(Button, { variant: "primary", icon: "upload", onClick: c.upload }, "Upload a photo"), /* @__PURE__ */ React.createElement(Button, { variant: "secondary", className: "s80-on-dark", onClick: () => c.setBlocked(false) }, "Try the camera again"))), c.shot && !busy && /* @__PURE__ */ React.createElement("span", { className: "s80-tag" }, c.shot.how === "camera" ? "Your photo" : c.shot.name || "Your photo"), /* @__PURE__ */ React.createElement(DropCue, { on: c.over && !busy, reduce: c.reduce }), /* @__PURE__ */ React.createElement(Overlays, { c })), busy ? /* @__PURE__ */ React.createElement(After, { c, me }) : c.shot ? /* @__PURE__ */ React.createElement(Review, { c, retake: () => {
    } }) : !c.blocked && /* @__PURE__ */ React.createElement("div", { className: "cam-bar s80-bar" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "s80-side", onClick: c.upload }, /* @__PURE__ */ React.createElement("span", { className: "s80-side-ic" }, /* @__PURE__ */ React.createElement(Icon, { name: "image", size: 22 })), /* @__PURE__ */ React.createElement("span", null, "Upload")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "shutter", "aria-label": "Take the photo", onClick: c.shutter }, /* @__PURE__ */ React.createElement("span", null)), /* @__PURE__ */ React.createElement("span", { className: "s80-side", "aria-hidden": "true" })), c.inputs, !busy && !c.blocked && /* @__PURE__ */ React.createElement("p", { className: "t-caption subtle", style: { textAlign: "center", margin: 0 } }, c.shot ? "Check that you can read the batch, both dates and the MRP." : desk ? `Or upload a photo you already took, or drop one on the frame. ${RULE}.` : `${RULE}.`));
  }
  function CameraInner({ me }) {
    const Opt = OPT === "b" ? OptionB : OPT === "c" ? OptionC : OptionA;
    return /* @__PURE__ */ React.createElement(Screen, { me, title: "Label photo", sub: "Batch MF-2409-117 · shelf B4", back: "Today" }, /* @__PURE__ */ React.createElement(Opt, { me }));
  }
  const Base = S.CameraScreen;
  function CameraScreen(props) {
    if (distOf(props.me).id !== "rakesh") return /* @__PURE__ */ React.createElement(Base, { ...props });
    return /* @__PURE__ */ React.createElement(CameraInner, { me: props.me });
  }
  Object.assign(window.SC3_SCREENS, { CameraScreen });
})();
