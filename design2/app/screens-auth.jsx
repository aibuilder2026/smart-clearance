// Smart-Clearance app v2 · sign in (Google, phone OTP, ExpireSoon account, demo accounts), profile and settings
(function () {
  const { useState, useEffect } = React;
  const K = window.SC2; const A = window.SC_APP;
  const { Icon, Avatar, Mark, Wordmark, Btn, Chip, Plate, Sheet, Input, Field, OTP, Segmented, Toggle, Select, Sun, Emblem, ModeSwitch, useTheme, cx } = K;
  const DB = window.DB, Auth = window.Auth;
  const IMG = window.SC2_IMG;

  function SignIn({ onSignedIn }) {
    const [mode, setMode] = useState("pick");        // pick · google · phone · otp
    const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
    const [phone, setPhone] = useState("+91 "); const [code, setCode] = useState(""); const [conf, setConf] = useState(null);
    const demo = DB.list("users", { where: { status: ["active", "invited"] } }).filter(u => ["u-priya", "u-rakesh", "u-ganesh", "u-venkat", "u-anita", "u-vikram", "u-arjun"].includes(u.id)).sort((a, b) => ["u-priya", "u-rakesh", "u-ganesh", "u-venkat", "u-anita", "u-vikram", "u-arjun"].indexOf(a.id) - ["u-priya", "u-rakesh", "u-ganesh", "u-venkat", "u-anita", "u-vikram", "u-arjun"].indexOf(b.id));
    const run = async fn => { setBusy(true); setErr(null); try { const u = await fn(); onSignedIn(u); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
    const sendCode = () => run(async () => { const c = await Auth.signInWithPhoneNumber(phone); setConf(c); setMode("otp"); throw { message: null }; }).catch(() => {});
    useEffect(() => { if (mode === "otp" && code.length === 6 && conf) run(() => conf.confirm(code)); }, [code]);
    const EMBLEM = { operator: "emblem-rooster", distributor: "emblem-van", retailer: "emblem-shop", buyer: "emblem-ship", finance: "emblem-ledger", sustainability: "emblem-tree", admin: "emblem-key" };
    return <div className="auth scroll">
      <div className="ahead"><Mark /><Wordmark size={18} /><div className="grow" /><ModeSwitch /></div>
      <div className="abody">
        <div className="ahero">
          <div className="sunstage"><Sun size={160} /><Mark size="xl" /></div>
          <Wordmark size={32} />
          <p className="tag">Every carton gets a second chance, chosen by AI.</p>
          <p className="tag hi">हर कार्टन को दूसरा मौका</p>
          <p className="t-small muted" style={{ maxWidth: "44ch" }}>Brand staff sign in with Google. Distributors and retailers sign in with their phone number. Buyers come through their ExpireSoon account. Judges can use a demo account.</p>
        </div>
        <Plate className="acard" reg>
          {mode === "pick" && <>
            <h2>Sign in</h2>
            <div className="providers">
              <Btn size="lg" icon="google" onClick={() => setMode("google")}>Continue with Google</Btn>
              <Btn size="lg" icon="phone" onClick={() => setMode("phone")}>Continue with phone number</Btn>
              <Btn size="lg" kind="market" icon="tag" loading={busy} onClick={() => run(() => Auth.signInWithMarketplace())}>Continue with ExpireSoon</Btn>
            </div>
            <div className="or">demo accounts</div>
            <div className="demo">{demo.map(u => <button type="button" key={u.id} className="who" disabled={busy} onClick={() => run(() => Auth.signInDemo(u.id))}><Avatar person={{ name: u.name, img: u.avatar }} size="md" /><span><b>{u.name}</b><span>{u.title} · {(DB.org(u.org) || {}).name}</span></span><Emblem src={IMG + (EMBLEM[u.role] || "emblem-sun") + ".webp"} size="sm" /></button>)}</div>
            <p className="fine">Demo accounts are pre-provisioned for judging and skip the identity provider. In production this list does not exist.</p>
          </>}
          {mode === "google" && <>
            <div className="row"><button type="button" className="backbtn" onClick={() => setMode("pick")}><Icon name="left" size={20} />Back</button><h2>Choose an account</h2></div>
            <p className="t-small muted">accounts.google.com would open here; the prototype lists the Google accounts that exist in the workspace.</p>
            <div className="accounts">{Auth.accounts().map(acc => <button type="button" key={acc.id} disabled={busy} onClick={() => run(() => Auth.signInWithGoogle(acc.email))}>{acc.avatar ? <Avatar person={{ name: acc.name, img: acc.avatar }} size="md" /> : <span className="ginitial">{A.initials(acc.name)}</span>}<span><b>{acc.name}</b><span>{acc.email}</span></span>{acc.status !== "active" && <Chip tone={acc.status === "invited" ? "chrome" : undefined}>{acc.status}</Chip>}</button>)}</div>
            <Field label="Or another Google account" id="gmail"><Input id="gmail" type="email" placeholder="name@munchly.in" onKeyDown={e => { if (e.key === "Enter") run(() => Auth.signInWithGoogle(e.target.value)); }} /></Field>
          </>}
          {mode === "phone" && <>
            <div className="row"><button type="button" className="backbtn" onClick={() => setMode("pick")}><Icon name="left" size={20} />Back</button><h2>Phone number</h2></div>
            <Field label="Mobile number" help="We send a 6-digit code by SMS. Try +91 98230 44118 (Rakesh bhai) or +91 98230 55120 (Ganesh ji)." id="ph"><Input id="ph" icon="phone" mono inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === "Enter" && sendCode()} /></Field>
            <Btn kind="primary" size="lg" icon="send" loading={busy} onClick={sendCode}>Send the code</Btn>
          </>}
          {mode === "otp" && <>
            <div className="row"><button type="button" className="backbtn" onClick={() => { setMode("phone"); setCode(""); }}><Icon name="left" size={20} />Back</button><h2>Enter the code</h2></div>
            <p className="t-small muted">Sent to {conf && conf.phone}. In the prototype any six digits work.</p>
            <OTP value={code} onChange={setCode} />
            <div className="row between"><Btn kind="ghost" size="sm" onClick={() => setCode("")}>Resend code</Btn>{busy && <span className="row t-small muted"><span className="spinner" />Verifying</span>}</div>
          </>}
          {err && <Plate tone="vermilion-soft" tight><b style={{ color: "var(--vermilion-text)" }}>{err}</b></Plate>}
        </Plate>
      </div>
    </div>;
  }

  function Profile({ user, nav, onSignOut }) {
    const { theme, setTheme } = useTheme();
    const [name, setName] = useState(user.name); const [lang, setLang] = useState(user.lang || "en"); const [saved, setSaved] = useState(false);
    const [push, setPush] = useState(true); const [email, setEmail] = useState(user.role !== "retailer"); const [reset, setReset] = useState(false);
    const save = async () => { await Auth.updateProfile({ name, lang }); setSaved(true); setTimeout(() => setSaved(false), 1800); };
    return <>
      <K.TopBar back="Back" onBack={() => history.back()} title="Profile and settings" />
      <div className="page">
        <div className="detail">
          <div className="main-col">
            <Plate><div className="profilecard">{user.avatar ? <Avatar person={{ name: user.name, img: user.avatar }} size="xl" /> : <span className="ginitial" style={{ width: 72, height: 72, fontSize: 24 }}>{A.initials(user.name)}</span>}<div><h2>{user.name}</h2><div className="t-small muted">{user.title} · {(DB.org(user.org) || {}).name}</div></div><div className="row wrap" style={{ justifyContent: "center" }}><A.RoleChip role={user.role} />{user.admin && <Chip tone="ultra" icon="shield">admin</Chip>}<Chip mono>{user.providerId === "google" ? user.email : user.phone}</Chip></div></div></Plate>
            <Plate className="stack"><h3>Account</h3>
              <div className="formgrid two">
                <Field label="Name" id="pname"><Input id="pname" value={name} onChange={e => setName(e.target.value)} /></Field>
                <Field label="Language" id="plang" help="Offers and pushes arrive in this language."><Select id="plang" value={lang} onChange={e => setLang(e.target.value)}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option><option value="te">తెలుగు</option></Select></Field>
                <Field label="Email" id="pmail"><Input id="pmail" value={user.email || "—"} disabled readOnly /></Field>
                <Field label="Phone" id="pph"><Input id="pph" mono value={user.phone || "—"} disabled readOnly /></Field>
              </div>
              <div className="row wrap"><Btn kind="primary" icon="check" onClick={save}>Save</Btn>{saved && <Chip tone="emerald" icon="check">saved</Chip>}</div>
            </Plate>
            <Plate className="stack"><h3>Notifications</h3>
              <div className="rulerow"><div><div className="lbl">Push notifications</div><div className="help">Every human moment arrives as a push: photo requests, plans, offers, awards.</div></div><Toggle on={push} onChange={setPush} label="Push notifications" /></div>
              <div className="rulerow"><div><div className="lbl">Email digest</div><div className="help">A morning summary after the Watcher runs.</div></div><Toggle on={email} onChange={setEmail} label="Email digest" /></div>
            </Plate>
          </div>
          <aside className="aside">
            <Plate className="stack-sm"><h3>Edition</h3><p className="t-small muted">Day for the godown at noon, Night for the 23:00 push. Auto follows the device.</p><Segmented options={[{ id: "day", label: "Day", icon: "sun" }, { id: "night", label: "Night", icon: "moon" }, { id: "auto", label: "Auto" }]} value={theme} onChange={setTheme} label="Edition" /></Plate>
            <Plate className="stack-sm"><h3>Session</h3><p className="t-small muted">Signed in with {user.providerId === "google" ? "Google" : user.providerId === "phone" ? "phone OTP" : user.providerId === "expiresoon" ? "ExpireSoon" : "a demo account"} · last seen {A.ago(user.lastSeen)}.</p><Btn kind="danger" icon="logout" onClick={onSignOut}>Sign out</Btn></Plate>
            {user.admin && <Plate tone="vermilion-soft" className="stack-sm"><b style={{ color: "var(--vermilion-text)" }}>Reset demo data</b><p className="t-small">Restores the seeded store on this browser. Everything anyone did in the prototype here is lost.</p><Btn kind="danger" size="sm" icon="refresh" onClick={() => setReset(true)}>Reset</Btn></Plate>}
          </aside>
        </div>
      </div>
      <A.ConfirmSheet open={reset} onClose={() => setReset(false)} title="Reset the demo data?" body="The store returns to its seed and you stay signed in." confirmLabel="Reset" danger onConfirm={async () => { window.Bus.cancelAll(); DB.reset(); }} />
    </>;
  }

  window.SC_APP = Object.assign(window.SC_APP, { SignIn, Profile });
})();
